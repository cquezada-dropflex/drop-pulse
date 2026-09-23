import { NextResponse } from "next/server";
import { parseSignedRequest } from "@/lib/integrations/meta/signed-request";
import { revokeMetaByFbUser } from "@/lib/integrations/meta/connection";

/** Callback de desautorización de Meta (spec §6.6): el usuario quitó DropFlex desde Facebook. */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const signed = parseSignedRequest(form?.get("signed_request")?.toString() ?? null);
  if (!signed) return NextResponse.json({ error: "signed_request no válido" }, { status: 400 });
  await revokeMetaByFbUser(signed.user_id);
  return NextResponse.json({ ok: true });
}
