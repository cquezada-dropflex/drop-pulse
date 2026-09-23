import { NextResponse } from "next/server";
import { body, mutate } from "@/lib/onboarding/http";
import { saveNumbers, suggestedNumbers } from "@/lib/onboarding/service";
import type { Numbers } from "@/lib/onboarding/types";

/** Valores sugeridos (la entrega se calcula con los pedidos de Shopify). */
export async function GET() {
  return NextResponse.json({ suggested: suggestedNumbers(), source: { deliveredOf10: "shopify-orders" } });
}

/** Paso 3 · Guarda los números (o `{ "sugeridos": true }`) y empieza a generar. */
export async function POST(req: Request) {
  const b = await body<Numbers & { sugeridos: boolean }>(req);
  return mutate((s, now) => saveNumbers(s, b.sugeridos ? null : b, now));
}
