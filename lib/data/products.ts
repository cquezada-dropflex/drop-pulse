// Acceso a productos. Hoy lee los mocks de lib/mock/; para Supabase, cambia el cuerpo de cada
// función por la consulta (ver docs/esquema-supabase.md) sin tocar la UI.
import { PRODUCTS } from "@/lib/mock/products";
import { CONTENT, IMAGES, NOTE, PRICING } from "@/lib/mock/content";
import type { ContentItem, ImageOption, Pricing, Product, ProductFilter } from "@/lib/types";

export async function getProducts(filter?: ProductFilter): Promise<Product[]> {
  return filter ? PRODUCTS.filter((p) => p.filter === filter) : PRODUCTS;
}

export async function getProductCounts(): Promise<Record<ProductFilter, number> & { total: number }> {
  const count = (f: ProductFilter) => PRODUCTS.filter((p) => p.filter === f).length;
  return { avanzan: count("avanzan"), detenidos: count("detenidos"), publicados: count("publicados"), total: PRODUCTS.length };
}

export async function getProduct(id: string): Promise<Product | null> {
  return PRODUCTS.find((p) => p.id === id) ?? null;
}

/** Propuestas de texto de un producto, en orden de revisión. */
export async function getProductContent(productId: string): Promise<ContentItem[]> {
  return CONTENT.filter((c) => c.productId === productId);
}

export async function getProductImages(productId: string): Promise<ImageOption[]> {
  return IMAGES.filter((i) => i.productId === productId);
}

export async function getPricing(productId: string): Promise<Pricing | null> {
  const found = PRICING.find((p) => p.productId === productId);
  if (found) return found;
  const product = await getProduct(productId);
  if (!product) return null;
  // Sin precio definido: la IA propone uno a partir del costo (estimado, entra como `generado`).
  return {
    productId,
    price: Math.round((product.supplierCost * 3.2) / 1000) * 1000 - 10,
    costs: [
      { label: "Costo del producto", value: product.supplierCost },
      { label: "Envío", value: 3500 },
      { label: "Publicidad por venta", value: 6000 },
    ],
    note: NOTE,
    status: "generado",
  };
}
