import "server-only";
import { after } from "next/server";
import { adminClient } from "../admin";
import { markShopifyError, getShopifyConnection, type ShopifyConnection } from "./connection";
import { shopifyQuery, ShopifyAuthError } from "./client";
import { toCatalogRow, numericId } from "./catalog";
import { ORDERS_QUERY, PRODUCTS_QUERY, type OrdersQuery, type ProductsQuery } from "./queries";

// Importación del catálogo sin bloquear (design-system/onboarding.md › 2). Portada de dropflex
// (lib/integrations/shopify/import.ts: cursor, páginas de 50 y el reintento sin costo si falta
// read_inventory), ahora por tramos con un lease para que dos invocaciones no importen a la vez.
// La empujan el callback y el sondeo de la UI (GET /api/onboarding/state y /shopify/products).

const PER_PAGE = 50;
const PAGES_PER_RUN = 5;
const LEASE_MS = 60_000;
const ORDER_PAGES = 20;

async function claimLease(userId: string): Promise<boolean> {
  const now = new Date();
  const { data, error } = await adminClient()
    .from("shopify_connections")
    .update({ import_lease_until: new Date(now.getTime() + LEASE_MS).toISOString() })
    .eq("user_id", userId)
    .eq("status", "connected")
    .or(`import_lease_until.is.null,import_lease_until.lt.${now.toISOString()}`)
    .select("user_id");
  if (error) throw new Error(`Tomar el lease de importación: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

async function update(userId: string, patch: Record<string, unknown>) {
  const { error } = await adminClient()
    .from("shopify_connections")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error(`Guardar el avance de la importación: ${error.message}`);
}

async function importProducts(conn: ShopifyConnection) {
  let cursor = conn.import_cursor;
  let count = conn.imported_count;
  let withCost = true;
  for (let page = 0; page < PAGES_PER_RUN; page++) {
    let data: ProductsQuery;
    try {
      data = await shopifyQuery<ProductsQuery>(conn, PRODUCTS_QUERY(withCost), { first: PER_PAGE, after: cursor });
    } catch (e) {
      // Sin read_inventory, unitCost da ACCESS_DENIED: se reintenta sin costo (como en dropflex).
      if (e instanceof ShopifyAuthError && withCost) {
        withCost = false;
        page--;
        continue;
      }
      throw e;
    }
    const rows = data.products.nodes.map((n) => ({ ...toCatalogRow(conn.user_id, n), synced_at: new Date().toISOString() }));
    if (rows.length) {
      const { error } = await adminClient().from("catalog_items").upsert(rows, { onConflict: "user_id,id" });
      if (error) throw new Error(`Guardar productos: ${error.message}`);
    }
    count += rows.length;
    cursor = data.products.pageInfo.endCursor;
    const done = !data.products.pageInfo.hasNextPage;
    await update(conn.user_id, {
      import_cursor: done ? null : cursor,
      imported_count: count,
      ...(done ? { import_status: "complete", total_count: count } : {}),
    });
    if (done) return true;
  }
  return false;
}

/** Ventas de 30 días por producto (para los recomendados). Pedidos sin datos de clientes. */
async function syncSales(conn: ShopifyConnection) {
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const sales = new Map<string, number>();
  let after: string | null = null;
  for (let page = 0; page < ORDER_PAGES; page++) {
    const data: OrdersQuery = await shopifyQuery<OrdersQuery>(conn, ORDERS_QUERY, { first: 100, after, query: `created_at:>=${since}` });
    for (const order of data.orders.nodes) {
      for (const li of order.lineItems.nodes) {
        if (!li.product) continue;
        const id = numericId(li.product.id);
        sales.set(id, (sales.get(id) ?? 0) + li.quantity);
      }
    }
    if (!data.orders.pageInfo.hasNextPage) break;
    after = data.orders.pageInfo.endCursor;
  }
  const db = adminClient();
  const entries = [...sales.entries()].slice(0, 500);
  for (let i = 0; i < entries.length; i += 20) {
    await Promise.all(
      entries.slice(i, i + 20).map(([id, qty]) => db.from("catalog_items").update({ sales_30d: qty }).eq("user_id", conn.user_id).eq("id", id)),
    );
  }
  await update(conn.user_id, { orders_synced_at: new Date().toISOString() });
}

/** Un tramo de trabajo: importa hasta 5 páginas y, al terminar el catálogo, las ventas. */
export async function importChunk(userId: string) {
  if (!(await claimLease(userId))) return;
  try {
    const conn = await getShopifyConnection(userId);
    if (!conn || conn.status !== "connected") return;
    if (conn.import_status === "importing" || conn.import_status === "pending") {
      const done = await importProducts(conn);
      if (!done) return;
    }
    const fresh = await getShopifyConnection(userId);
    if (fresh && !fresh.orders_synced_at) {
      try {
        await syncSales(fresh);
      } catch (e) {
        // Sin acceso a pedidos (p. ej. sin aprobación de datos protegidos): los recomendados se ordenan
        // solo por potencial de mejora. No es motivo para romper la conexión.
        if (!(e instanceof ShopifyAuthError)) throw e;
        console.warn("[shopify/import] sin acceso a pedidos:", e.message);
        await update(userId, { orders_synced_at: new Date().toISOString() });
      }
    }
  } catch (e) {
    if (e instanceof ShopifyAuthError) {
      await markShopifyError(userId, "expired");
    } else {
      // Un error de red o de Shopify no cambia el estado: el próximo sondeo retoma desde el cursor.
      console.error("[shopify/import]", userId, (e as Error).message);
    }
  } finally {
    await update(userId, { import_lease_until: null }).catch(() => {});
  }
}

/** ¿Queda trabajo? Si sí, lo agenda después de responder (no demora la respuesta). */
export function needsImportWork(conn: ShopifyConnection | null): boolean {
  if (!conn || conn.status !== "connected") return false;
  const leased = conn.import_lease_until && Date.parse(conn.import_lease_until) > Date.now();
  if (leased) return false;
  return conn.import_status === "importing" || conn.import_status === "pending" || !conn.orders_synced_at;
}

export function kickImport(conn: ShopifyConnection | null) {
  if (!conn || !needsImportWork(conn)) return;
  after(() => importChunk(conn.user_id));
}
