import { NextResponse } from "next/server";
import { body, mutate } from "@/lib/onboarding/http";
import { metaAssets, saveMetaAssets } from "@/lib/onboarding/service";

/** Cuentas publicitarias, páginas y píxeles del Business Manager, con la sugerencia. */
export async function GET() {
  return NextResponse.json(metaAssets());
}

/** Guarda la cuenta, la página y el píxel elegidos, y termina el onboarding. */
export async function POST(req: Request) {
  const sel = await body<{ account: string; page: string; pixel: string }>(req);
  return mutate((s, now) => saveMetaAssets(s, sel, now));
}
