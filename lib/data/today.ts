// Cola de decisiones de Hoy. Los productos salen de Supabase (lib/data/products.ts); las campañas
// siguen siendo de ejemplo (lib/mock/today.ts) hasta conectar Meta Ads.
import "server-only";
import { getProducts } from "@/lib/data/products";
import { TODAY } from "@/lib/mock/today";
import { productHref } from "@/lib/routes";
import type { AttentionEntry, Product, TodaySummary } from "@/lib/types";

/** Ítems de campaña de ejemplo (los de producto ya no aplican: sus productos no existen). */
const CAMPAIGN_ITEMS = TODAY.filter((e) => e.kind === "ads" || e.kind === "ads-up");

function productEntries(products: Product[]): AttentionEntry[] {
  const out: AttentionEntry[] = [];
  for (const p of products) {
    const base = p.stages.find((s) => s.key === "importado");
    const href = productHref(p.id, "importado");
    if (base?.state === "error") {
      out.push({
        id: `optimize-error-${p.id}`,
        group: "primero",
        kind: "error",
        title: "No se pudo optimizar",
        product: p.name,
        detail: base.desc,
        actions: [{ label: "Reintentar", href, variant: "primary" }],
      });
    } else if (base?.state === "review") {
      out.push({
        id: `avatar-review-${p.id}`,
        group: "revisar",
        kind: "review",
        title: "Tu cliente ideal está listo",
        product: p.name,
        actions: [{ label: "Revisar ahora", href, iconEnd: "chevron-right" }],
      });
    } else if (base?.state === "current" && p.reason.startsWith("Sin optimizar")) {
      out.push({
        id: `optimize-${p.id}`,
        group: "revisar",
        kind: "stuck",
        title: "Falta optimizar con IA",
        product: `${p.name} · agrega lo que sabes y sus imágenes`,
        actions: [{ label: "Empezar", href, iconEnd: "chevron-right" }],
      });
    }
  }
  return out;
}

/** Decisiones pendientes, ya ordenadas por impacto: errores y dinero primero, revisión, lo detenido. */
export async function getTodayQueue(): Promise<AttentionEntry[]> {
  const entries = productEntries(await getProducts());
  const rank = (e: AttentionEntry) => (e.kind === "error" ? 0 : e.kind === "ads" || e.kind === "ads-up" ? 1 : e.kind === "review" ? 2 : 3);
  return [...entries, ...CAMPAIGN_ITEMS].sort((a, b) => rank(a) - rank(b));
}

export async function getTodaySummary(): Promise<TodaySummary> {
  const [queue, products] = await Promise.all([getTodayQueue(), getProducts()]);
  return {
    date: new Date().toISOString().slice(0, 10),
    pending: queue.length,
    errors: queue.filter((e) => e.kind === "error").length,
    published: products.filter((p) => p.filter === "publicados").length,
  };
}

/** Número de la pestaña Hoy. */
export async function getNavBadges(): Promise<{ hoy: number }> {
  return { hoy: (await getTodayQueue()).length };
}
