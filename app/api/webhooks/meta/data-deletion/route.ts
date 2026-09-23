import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { adminClient } from "@/lib/integrations/admin";
import { appUrl } from "@/lib/integrations/env";
import { parseSignedRequest } from "@/lib/integrations/meta/signed-request";
import { deleteMetaConnection } from "@/lib/integrations/meta/connection";

/**
 * Callback de borrado de datos de Meta (spec §6.6): borra el token y la conexión de ese usuario de
 * Facebook y responde con la URL de estado y el código de confirmación que exige Meta.
 */
export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const signed = parseSignedRequest(form?.get("signed_request")?.toString() ?? null);
  if (!signed) return NextResponse.json({ error: "signed_request no válido" }, { status: 400 });

  const db = adminClient();
  const { data, error } = await db.from("meta_connections").select("user_id").eq("fb_user_id", signed.user_id);
  if (error) return NextResponse.json({ error: "No pudimos procesar la solicitud" }, { status: 500 });
  for (const row of data ?? []) await deleteMetaConnection(row.user_id as string);

  const code = randomBytes(8).toString("hex");
  const insert = await db.from("data_deletion_requests").insert({
    confirmation_code: code,
    provider: "meta",
    external_user_id: signed.user_id,
    status: "completed",
    completed_at: new Date().toISOString(),
  });
  if (insert.error) return NextResponse.json({ error: "No pudimos registrar la solicitud" }, { status: 500 });
  return NextResponse.json({ url: `${appUrl()}/auth/data-deletion/${code}`, confirmation_code: code });
}
