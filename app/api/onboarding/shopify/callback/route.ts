import { NextResponse, type NextRequest } from "next/server";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding/store";
import { finishShopify } from "@/lib/onboarding/service";

/** Vuelta del OAuth de Shopify: guarda la conexión (o el error) y vuelve al Paso 1. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const next = finishShopify(
    await readOnboarding(),
    { shop: q.get("shop") ?? "", nonce: q.get("state") ?? "", result: q.get("result") ?? "" },
    Date.now(),
  );
  await writeOnboarding(next);
  return NextResponse.redirect(new URL("/onboarding/shopify", req.url));
}
