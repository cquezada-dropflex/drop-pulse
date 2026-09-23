import { NextResponse } from "next/server";
import { errorResponse, nonce } from "@/lib/onboarding/http";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding/store";
import { startMeta } from "@/lib/onboarding/service";

/** Paso 4 · Inicia Facebook Login for Business. Responde con la URL de autorización. */
export async function POST() {
  try {
    const { state, authorizeUrl } = startMeta(await readOnboarding(), nonce());
    await writeOnboarding(state);
    return NextResponse.json({ authorizeUrl });
  } catch (e) {
    return errorResponse(e);
  }
}
