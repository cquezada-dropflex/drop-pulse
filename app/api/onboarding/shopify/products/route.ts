import { NextResponse } from "next/server";
import { readOnboarding } from "@/lib/onboarding/store";
import { productLists } from "@/lib/onboarding/service";

/** Productos importados hasta ahora: recomendados (12) y todos. */
export async function GET() {
  return NextResponse.json(productLists(await readOnboarding(), Date.now()));
}
