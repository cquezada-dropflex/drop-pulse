import { NextResponse } from "next/server";
import { body, errorResponse } from "@/lib/onboarding/http";
import { requireUser } from "@/lib/integrations/session";
import { startShopifyOAuth } from "@/lib/integrations/shopify/start";

/** Paso 1 · Valida la tienda e inicia el OAuth. Responde con la URL de autorización de Shopify. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { shop } = await body<{ shop: string }>(req);
    const authorizeUrl = await startShopifyOAuth(user.id, String(shop ?? ""), { probe: true });
    return NextResponse.json({ authorizeUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
