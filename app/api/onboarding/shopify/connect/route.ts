import { NextResponse } from "next/server";
import { body, errorResponse, nonce } from "@/lib/onboarding/http";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding/store";
import { startShopify } from "@/lib/onboarding/service";

/** Paso 1 · Valida la tienda e inicia el OAuth. Responde con la URL de autorización. */
export async function POST(req: Request) {
  try {
    const { shop } = await body<{ shop: string }>(req);
    const { state, authorizeUrl } = startShopify(await readOnboarding(), String(shop ?? ""), nonce());
    await writeOnboarding(state);
    return NextResponse.json({ authorizeUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
