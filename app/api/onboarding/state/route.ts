import { NextResponse } from "next/server";
import { clearOnboarding, readOnboarding } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";

/** Estado del onboarding con lo derivado (importación, generación, paso pendiente). */
export async function GET() {
  return NextResponse.json(snapshot(await readOnboarding(), Date.now()));
}

/** Reinicia el onboarding (útil para probar la maqueta). */
export async function DELETE() {
  await clearOnboarding();
  return new NextResponse(null, { status: 204 });
}
