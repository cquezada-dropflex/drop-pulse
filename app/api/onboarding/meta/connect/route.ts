import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { OnboardingError } from "@/lib/onboarding/types";
import { beginOAuth } from "@/lib/integrations/oauth-state";
import { markMetaConnecting } from "@/lib/integrations/meta/connection";
import { authorizeUrl } from "@/lib/integrations/meta/oauth";

/** Paso 4 · Inicia Facebook Login for Business. Responde con la URL de autorización. */
export async function POST() {
  try {
    const { state, shop, meta } = await readOnboardingForApi();
    if (!shop || shop.status !== "connected") throw new OnboardingError("Primero conecta tu tienda Shopify.", 409);
    await markMetaConnecting(state.userId);
    const signed = await beginOAuth("meta", state.userId);
    // Al reconectar se vuelve a pedir lo que el comerciante haya rechazado antes.
    return NextResponse.json({ authorizeUrl: authorizeUrl(signed, Boolean(meta)) });
  } catch (e) {
    return errorResponse(e);
  }
}
