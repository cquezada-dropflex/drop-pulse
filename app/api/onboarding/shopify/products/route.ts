import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { productLists } from "@/lib/onboarding/service";
import { loadCatalog } from "@/lib/onboarding/catalog";
import { kickImport } from "@/lib/integrations/shopify/import";

/** Productos importados hasta ahora: recomendados (12) y todos. */
export async function GET() {
  try {
    const { state, shop } = await readOnboardingForApi();
    kickImport(shop);
    return NextResponse.json(productLists(await loadCatalog(state.userId), state.shop?.total ?? 0));
  } catch (e) {
    return errorResponse(e);
  }
}
