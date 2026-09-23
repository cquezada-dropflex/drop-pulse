import "server-only";
import { adminClient } from "@/lib/integrations/admin";
import { numericId } from "@/lib/integrations/shopify/catalog";
import { shopifyQuery, ShopifyAuthError } from "@/lib/integrations/shopify/client";
import { getShopifyConnection, type ShopifyConnection } from "@/lib/integrations/shopify/connection";
import { PRODUCT_DETAIL_QUERY, type ProductDetailNode, type ProductDetailQuery } from "@/lib/integrations/shopify/queries";
import { getMarket } from "@/lib/settings/market";

// Los productos que el comerciante eligió en el onboarding pasan de catalog_items (el espejo liviano
// del catálogo) a products, con su descripción completa y todas sus imágenes. Parten en la etapa
// Información base: el texto viene lleno con la descripción de Shopify para no partir de cero.

const num = (v: string | null | undefined) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

async function fetchDetail(conn: ShopifyConnection, id: string): Promise<ProductDetailNode | null> {
  const gid = `gid://shopify/Product/${id}`;
  try {
    return (await shopifyQuery<ProductDetailQuery>(conn, PRODUCT_DETAIL_QUERY(true), { id: gid })).product;
  } catch (e) {
    // Sin read_inventory, unitCost da ACCESS_DENIED: se reintenta sin costo (como la importación).
    if (e instanceof ShopifyAuthError) return (await shopifyQuery<ProductDetailQuery>(conn, PRODUCT_DETAIL_QUERY(false), { id: gid })).product;
    throw e;
  }
}

async function insertProduct(userId: string, node: ProductDetailNode, currency: string) {
  const db = adminClient();
  const variant = node.variants.nodes[0];
  const description = node.description?.trim() ?? "";
  const { data, error } = await db
    .from("products")
    .upsert(
      {
        user_id: userId,
        shopify_product_id: numericId(node.id),
        shopify_gid: node.id,
        title: node.title,
        handle: node.handle,
        vendor: node.vendor || null,
        product_type: node.productType || null,
        category: node.category?.fullName ?? null,
        tags: node.tags ?? [],
        options: node.options ?? [],
        description,
        base_info: description,
        price: num(variant?.price) ?? 0,
        compare_at_price: num(variant?.compareAtPrice),
        cost: num(variant?.inventoryItem?.unitCost?.amount),
        currency,
        shopify_status: node.status,
      },
      { onConflict: "user_id,shopify_product_id", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Guardar el producto: ${error.message}`);
  if (!data) return; // Ya existía (otra invocación lo creó primero).

  const images = node.media.nodes
    .filter((m) => m.mediaContentType === "IMAGE" && m.image?.url)
    .map((m, i) => ({
      product_id: data.id,
      user_id: userId,
      source: "shopify",
      shopify_media_id: m.id,
      url: m.image!.url,
      alt: m.alt || null,
      width: m.image!.width,
      height: m.image!.height,
      position: i,
      is_cover: m.id === node.featuredMedia?.id,
    }));
  if (images.length) {
    const { error: imgError } = await db.from("product_reference_images").insert(images);
    if (imgError) throw new Error(`Guardar las imágenes: ${imgError.message}`);
  }
}

/**
 * Crea los productos elegidos que aún no existen. Idempotente: se puede llamar al empezar a generar
 * y otra vez al abrir Productos. Un producto que Shopify ya no tiene se salta sin frenar a los demás.
 */
export async function syncSelectedProducts(userId: string): Promise<number> {
  const db = adminClient();
  const [{ data: onboarding, error: obError }, { data: existing, error: exError }] = await Promise.all([
    db.from("onboarding").select("selected").eq("user_id", userId).maybeSingle(),
    db.from("products").select("shopify_product_id").eq("user_id", userId),
  ]);
  if (obError) throw new Error(`Leer la selección: ${obError.message}`);
  if (exError) throw new Error(`Leer los productos: ${exError.message}`);
  const have = new Set((existing ?? []).map((r) => r.shopify_product_id as string));
  const missing = ((onboarding?.selected as string[] | undefined) ?? []).filter((id) => !have.has(id));
  if (!missing.length) return 0;

  const conn = await getShopifyConnection(userId);
  if (!conn || conn.status !== "connected") return 0;
  const { market } = await getMarket(userId, conn);

  let created = 0;
  for (const id of missing) {
    try {
      const node = await fetchDetail(conn, id);
      if (!node) continue;
      await insertProduct(userId, node, market.currency);
      created++;
    } catch (e) {
      console.error(`[products/sync] producto ${id}`, e);
      if (e instanceof ShopifyAuthError) break;
    }
  }
  return created;
}
