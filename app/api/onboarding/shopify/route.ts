import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";
import { requireUser } from "@/lib/integrations/session";
import { revokeShopify } from "@/lib/integrations/shopify/connection";

/** Ajustes › Conexiones · “Desconectar”: borra el token de Vault. Lo importado se conserva. */
export async function DELETE() {
  try {
    const user = await requireUser();
    await revokeShopify(user.id, "disconnected");
    const { state } = await readOnboardingForApi();
    return NextResponse.json({ snapshot: snapshot(state, Date.now()) });
  } catch (e) {
    return errorResponse(e);
  }
}
