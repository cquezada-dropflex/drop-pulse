import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { generationStatus } from "@/lib/onboarding/service";

/** Avance de la IA sobre los productos elegidos (la generación sigue simulada). */
export async function GET() {
  try {
    const status = generationStatus((await readOnboardingForApi()).state, Date.now());
    return status ? NextResponse.json(status) : NextResponse.json({ error: "La generación aún no empieza." }, { status: 404 });
  } catch (e) {
    return errorResponse(e);
  }
}
