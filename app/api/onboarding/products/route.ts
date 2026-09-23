import { body, mutate } from "@/lib/onboarding/http";
import { saveSelection } from "@/lib/onboarding/service";
import { catalogByIds } from "@/lib/onboarding/catalog";

/** Paso 2 · Guarda los productos elegidos (solo de su catálogo, máximo el límite del plan). */
export async function POST(req: Request) {
  const { ids } = await body<{ ids: string[] }>(req);
  const list = Array.isArray(ids) ? ids.map(String).slice(0, 100) : [];
  return mutate(async (s) => saveSelection(s, list, new Set((await catalogByIds(s.userId, list)).keys())));
}
