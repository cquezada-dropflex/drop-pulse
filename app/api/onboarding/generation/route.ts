import { NextResponse } from "next/server";
import { readOnboarding } from "@/lib/onboarding/store";
import { generationStatus } from "@/lib/onboarding/service";

/** Avance de la IA sobre los productos elegidos. */
export async function GET() {
  const status = generationStatus(await readOnboarding(), Date.now());
  return status ? NextResponse.json(status) : NextResponse.json({ error: "La generación aún no empieza." }, { status: 404 });
}
