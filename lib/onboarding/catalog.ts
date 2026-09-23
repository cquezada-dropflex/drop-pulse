// Catálogo simulado de la tienda Shopify del comerciante: 128 productos en CLP.
// Los 5 primeros salen de design-system/reference/bundle.js (ObProductos / ObDeskProductos);
// el resto completa el conteo “Todos 128” con nombres de ejemplo.
import { productImage } from "@/lib/mock/images";
import type { CatalogProduct } from "./types";

const REFERENCE: Omit<CatalogProduct, "image">[] = [
  { id: "corrector-de-postura", name: "Corrector de postura", price: 24990, cost: 6900, sales30: 41, issues: ["Sin descripción", "2 imágenes"], score: "Alta" },
  { id: "lampara-lunar-3d", name: "Lámpara lunar 3D", price: 19990, cost: 7400, sales30: 18, issues: ["Título de proveedor"], score: "Alta" },
  { id: "botella-termica-1l", name: "Botella térmica 1L", price: 14990, cost: 5200, sales30: 9, issues: ["Imágenes con texto chino"], score: "Media" },
  { id: "masajeador-de-cuello", name: "Masajeador de cuello", price: 29990, cost: 9800, sales30: 3, issues: ["Sin precio tachado"], score: "Media" },
  { id: "organizador-de-cables", name: "Organizador de cables", price: 9990, cost: 2400, sales30: 2, issues: [], score: "Baja" },
];

const NAMES = [
  "Soporte de celular para auto", "Almohada cervical", "Rodillo de masaje", "Mini proyector portátil",
  "Humidificador de aroma", "Faja lumbar", "Lámpara de escritorio LED", "Cepillo alisador", "Faja reductora",
  "Termo para café", "Set de brochas", "Audífonos deportivos", "Alfombra de yoga", "Reloj inteligente",
  "Lámpara de sal", "Mochila antirrobo", "Plancha de vapor", "Organizador de maquillaje", "Tira LED",
  "Dispensador de jabón", "Cortador de verduras", "Botella con filtro", "Parche de calor", "Cinturón de masaje",
  "Pesas ajustables", "Banda elástica", "Cojín ortopédico", "Rizador inalámbrico",
];
const VARIANTS = ["", " Pro", " Mini", " Plus", " XL"];
const ISSUES = ["Sin descripción", "2 imágenes", "Título de proveedor", "Imágenes con texto chino", "Sin precio tachado", "Descripción copiada"];

function seeded(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const GENERATED: Omit<CatalogProduct, "image">[] = Array.from({ length: 128 - REFERENCE.length }, (_, n) => {
  const i = n + REFERENCE.length;
  const name = `${NAMES[n % NAMES.length]}${VARIANTS[Math.floor(n / NAMES.length) % VARIANTS.length]}`;
  const r = seeded(i);
  const price = 7990 + Math.round((r * 25000) / 1000) * 1000;
  const issueCount = r > 0.66 ? 2 : r > 0.25 ? 1 : 0;
  const issues = Array.from({ length: issueCount }, (_, k) => ISSUES[(i + k * 2) % ISSUES.length]);
  // Sin ventas recientes: los 5 de la referencia encabezan los recomendados, en su orden.
  const sales30 = 0;
  return {
    id: `p-${i + 1}`,
    name,
    price,
    cost: Math.round(price * 0.3),
    sales30,
    issues,
    score: issueCount === 2 ? "Alta" : issueCount === 1 ? "Media" : "Baja",
  };
});

export const CATALOG: CatalogProduct[] = [...REFERENCE, ...GENERATED].map((p, i) => ({
  ...p,
  image: productImage(i < REFERENCE.length ? [1, 2, 0, 4, 3][i] : i),
}));

const SCORE = { Alta: 3, Media: 2, Baja: 1 } as const;

/** Recomendados: ordenados por ventas × potencial de mejora; los 12 primeros. */
export function recommended(products: CatalogProduct[]): CatalogProduct[] {
  return [...products]
    .sort((a, b) => b.sales30 * SCORE[b.score] - a.sales30 * SCORE[a.score] || b.sales30 - a.sales30 || SCORE[b.score] - SCORE[a.score])
    .slice(0, 12);
}

export function findProduct(id: string) {
  return CATALOG.find((p) => p.id === id);
}
