import { body, mutate } from "@/lib/onboarding/http";
import { saveSelection } from "@/lib/onboarding/service";

/** Paso 2 · Guarda los productos elegidos (máximo el límite del plan). */
export async function POST(req: Request) {
  const { ids } = await body<{ ids: string[] }>(req);
  return mutate((s) => saveSelection(s, Array.isArray(ids) ? ids.map(String) : []));
}
