import { NextResponse } from "next/server";
import { body, errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";
import { OnboardingError } from "@/lib/onboarding/types";
import { validateMarket, type Market } from "@/lib/market";
import { saveMarket } from "@/lib/settings/market";

/**
 * “Tienda conectada” · confirma el mercado detectado en Shopify (o el que el comerciante corrigió):
 * país, moneda e idioma. También lo usa Ajustes. Responde el snapshot con el mercado confirmado.
 */
export async function POST(req: Request) {
  try {
    const input = await body<Market>(req);
    const loaded = await readOnboardingForApi();
    if (!loaded.shop || loaded.shop.status !== "connected") {
      throw new OnboardingError("Primero conecta tu tienda Shopify.", 409);
    }
    const checked = validateMarket({ ...input, timezone: loaded.shop.timezone });
    if (!checked.ok) throw new OnboardingError(checked.error, 400, checked.field);
    await saveMarket(loaded.state.userId, checked.market);
    const { state } = await readOnboardingForApi();
    return NextResponse.json({ snapshot: snapshot(state, Date.now()) });
  } catch (e) {
    return errorResponse(e);
  }
}
