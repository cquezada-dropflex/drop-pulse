import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/onboarding/http";
import { readOnboardingForApi } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";
import { requireUser } from "@/lib/integrations/session";
import { deleteMetaConnection, metaToken } from "@/lib/integrations/meta/connection";
import { revokePermissions } from "@/lib/integrations/meta/oauth";

/** Ajustes › Conexiones · “Desconectar”: quita los permisos en Meta y borra el token. Queda pendiente. */
export async function DELETE() {
  try {
    const user = await requireUser();
    const token = await metaToken(user.id);
    if (token) await revokePermissions(token);
    await deleteMetaConnection(user.id);
    const { state } = await readOnboardingForApi();
    return NextResponse.json({ snapshot: snapshot(state, Date.now()) });
  } catch (e) {
    return errorResponse(e);
  }
}
