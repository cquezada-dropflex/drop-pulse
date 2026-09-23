import type { CatalogProduct } from "@/lib/onboarding/types";
import type { ProductNode } from "./queries";

// Shopify → catalog_items → CatalogProduct (lo que muestra PickRow en O4).
// Los “issues” son reglas deterministas sobre datos reales; los que necesitan leer la imagen o el
// texto (“Título de proveedor”, “Imágenes con texto chino”) quedan para el análisis con IA.

export interface CatalogRow {
  user_id: string;
  id: string;
  title: string;
  handle: string | null;
  image_url: string | null;
  price: number;
  compare_at: number | null;
  cost: number | null;
  media_count: number;
  has_description: boolean;
  sales_30d: number;
  status: string;
}

/** gid://shopify/Product/123 → "123" */
export function numericId(gid: string): string {
  return gid.slice(gid.lastIndexOf("/") + 1);
}

const num = (v: string | null | undefined) => {
  const n = v == null ? NaN : Number(v);
  return Number.isFinite(n) ? n : null;
};

export function toCatalogRow(userId: string, node: ProductNode): Omit<CatalogRow, "sales_30d"> {
  const variant = node.variants.nodes[0];
  return {
    user_id: userId,
    id: numericId(node.id),
    title: node.title,
    handle: node.handle,
    image_url: node.featuredMedia?.preview?.image?.url ?? null,
    price: num(variant?.price) ?? 0,
    compare_at: num(variant?.compareAtPrice),
    cost: num(variant?.inventoryItem?.unitCost?.amount),
    media_count: node.mediaCount?.count ?? 0,
    has_description: node.description.trim().length > 0,
    status: node.status,
  };
}

export function issuesOf(row: Pick<CatalogRow, "has_description" | "media_count" | "compare_at" | "price">): string[] {
  const issues: string[] = [];
  if (!row.has_description) issues.push("Sin descripción");
  if (row.media_count === 0) issues.push("Sin imágenes");
  else if (row.media_count < 3) issues.push(row.media_count === 1 ? "1 imagen" : `${row.media_count} imágenes`);
  if (row.compare_at == null || row.compare_at <= row.price) issues.push("Sin precio tachado");
  return issues;
}

export function toCatalogProduct(row: CatalogRow): CatalogProduct {
  const issues = issuesOf(row);
  return {
    id: row.id,
    name: row.title,
    image: row.image_url ?? "",
    price: Number(row.price),
    cost: row.cost == null ? 0 : Number(row.cost),
    sales30: row.sales_30d,
    issues,
    score: issues.length >= 2 ? "Alta" : issues.length === 1 ? "Media" : "Baja",
  };
}
