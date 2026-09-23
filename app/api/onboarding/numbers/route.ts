import { NextResponse, after } from "next/server";
import { syncSelectedProducts } from "@/lib/products/sync";
import { body, errorResponse, mutate } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { saveNumbers, suggestedNumbers } from "@/lib/onboarding/service";
import { catalogByIds, catalogPrices } from "@/lib/onboarding/catalog";
import type { Numbers } from "@/lib/onboarding/types";

/** Valores sugeridos. La entrega aún no se calcula con los pedidos (spec D7): sin destello. */
export async function GET() {
  try {
    const { state } = await readOnboardingForApi();
    const currency = state.shop?.currency || "CLP";
    return NextResponse.json({ suggested: suggestedNumbers(currency, await catalogPrices(state.userId)), currency, source: {} });
  } catch (e) {
    return errorResponse(e);
  }
}

/**
 * Paso 3 · Guarda los números (o `{ "sugeridos": true }`) y empieza a generar. Los productos elegidos
 * pasan a `products` (con su descripción e imágenes de Shopify) sin demorar la respuesta.
 */
export async function POST(req: Request) {
  const b = await body<Numbers & { sugeridos: boolean }>(req);
  let userId: string | undefined;
  const res = await mutate(async (s, now) => {
    userId = s.userId;
    const currency = s.shop?.currency || "CLP";
    const [prices, picked] = await Promise.all([catalogPrices(s.userId), catalogByIds(s.userId, s.selected)]);
    const products = new Map([...picked].map(([id, p]) => [id, { name: p.name, image: p.image }]));
    return saveNumbers(s, b.sugeridos ? null : b, now, { currency, suggested: suggestedNumbers(currency, prices), products });
  });
  if (res.ok && userId) {
    const id = userId;
    after(() => syncSelectedProducts(id).catch((e) => console.error("[onboarding/numbers] productos", e)));
  }
  return res;
}
