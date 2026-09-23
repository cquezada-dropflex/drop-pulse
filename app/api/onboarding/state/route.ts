import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";
import { kickImport } from "@/lib/integrations/shopify/import";

/** Estado del onboarding con lo derivado. El sondeo de la UI también empuja la importación. */
export async function GET() {
  try {
    const { state, shop } = await readOnboardingForApi();
    kickImport(shop);
    return NextResponse.json(snapshot(state, Date.now()));
  } catch (e) {
    return errorResponse(e);
  }
}
