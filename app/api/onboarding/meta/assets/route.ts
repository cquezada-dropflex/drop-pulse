import { NextResponse } from "next/server";
import { body, errorResponse, mutate } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { finish } from "@/lib/onboarding/service";
import { loadMetaAssets, saveMetaAssets } from "@/lib/integrations/meta/select";

/** Cuentas publicitarias, páginas y píxeles del Business Manager, con la sugerencia. */
export async function GET() {
  try {
    const { state } = await readOnboardingForApi();
    return NextResponse.json(await loadMetaAssets(state.userId, state.shop?.currency ?? null));
  } catch (e) {
    return errorResponse(e);
  }
}

/** Guarda la cuenta, la página y el píxel (validados contra Meta) y termina el onboarding. */
export async function POST(req: Request) {
  const sel = await body<{ account: string; page: string; pixel: string }>(req);
  return mutate(async (s, now) => {
    await saveMetaAssets(s.userId, sel);
    const { state } = await readOnboardingForApi();
    return finish({ ...s, meta: state.meta }, now);
  });
}
