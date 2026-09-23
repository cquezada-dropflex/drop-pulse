import "server-only";
import { adminClient } from "@/lib/integrations/admin";
import { toCatalogProduct, type CatalogRow } from "@/lib/integrations/shopify/catalog";
import type { CatalogProduct } from "./types";

// Catálogo importado de Shopify (catalog_items) para O4 y O5. Reemplaza al catálogo simulado.

/** Tope de filas para “Todos” en O4; el conteo total sale de la conexión. */
const LIST_LIMIT = 1000;

export async function loadCatalog(userId: string): Promise<CatalogProduct[]> {
  const { data, error } = await adminClient()
    .from("catalog_items")
    .select("*")
    .eq("user_id", userId)
    .order("sales_30d", { ascending: false })
    .order("title", { ascending: true })
    .limit(LIST_LIMIT);
  if (error) throw new Error(`Leer el catálogo: ${error.message}`);
  return (data as CatalogRow[]).map(toCatalogProduct);
}

export async function catalogByIds(userId: string, ids: string[]): Promise<Map<string, CatalogProduct>> {
  if (!ids.length) return new Map();
  const { data, error } = await adminClient().from("catalog_items").select("*").eq("user_id", userId).in("id", ids);
  if (error) throw new Error(`Leer productos: ${error.message}`);
  return new Map((data as CatalogRow[]).map((r) => [r.id, toCatalogProduct(r)]));
}

export async function catalogPrices(userId: string): Promise<number[]> {
  const { data, error } = await adminClient().from("catalog_items").select("price").eq("user_id", userId).limit(LIST_LIMIT);
  if (error) throw new Error(`Leer precios: ${error.message}`);
  return (data ?? []).map((r) => Number(r.price)).filter((n) => Number.isFinite(n));
}
