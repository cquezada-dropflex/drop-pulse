import { NextResponse, type NextRequest } from "next/server";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding/store";
import { finishMeta } from "@/lib/onboarding/service";

/** Vuelta de Facebook: si autorizó, falta elegir cuenta, página y píxel. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const next = finishMeta(await readOnboarding(), { nonce: q.get("state") ?? "", result: q.get("result") ?? "" });
  await writeOnboarding(next);
  const to = next.meta?.status === "action" ? "/onboarding/meta/accounts" : "/onboarding/meta";
  return NextResponse.redirect(new URL(to, req.url));
}
