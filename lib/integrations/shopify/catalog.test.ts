import { describe, expect, it } from "vitest";
import { issuesOf, numericId, toCatalogProduct, toCatalogRow } from "./catalog";

const node = {
  id: "gid://shopify/Product/42",
  title: "Corrector de postura",
  handle: "corrector",
  status: "ACTIVE",
  description: "",
  mediaCount: { count: 2 },
  featuredMedia: { preview: { image: { url: "https://cdn.shopify.com/x.jpg" } } },
  variants: { nodes: [{ price: "24990.00", compareAtPrice: null, inventoryItem: { unitCost: { amount: "6900.0" } } }] },
};

describe("catálogo", () => {
  it("mapea el producto de Shopify", () => {
    const row = toCatalogRow("u1", node);
    expect(row).toMatchObject({ id: "42", price: 24990, cost: 6900, media_count: 2, has_description: false, compare_at: null });
    expect(numericId(node.id)).toBe("42");
  });

  it("marca lo que la IA puede mejorar", () => {
    expect(issuesOf({ has_description: false, media_count: 2, compare_at: null, price: 10 })).toEqual(["Sin descripción", "2 imágenes", "Sin precio tachado"]);
    expect(issuesOf({ has_description: true, media_count: 5, compare_at: 20, price: 10 })).toEqual([]);
  });

  it("el puntaje sale de cuántas mejoras tiene", () => {
    const p = toCatalogProduct({ ...toCatalogRow("u1", node), sales_30d: 41 });
    expect(p).toMatchObject({ score: "Alta", sales30: 41, image: "https://cdn.shopify.com/x.jpg" });
  });
});
