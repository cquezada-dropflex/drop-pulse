import { NextResponse, type NextRequest } from "next/server";
import { finishOAuth } from "@/lib/integrations/oauth-state";
import { sessionUser } from "@/lib/integrations/session";
import { markMetaAuthorized, markMetaError } from "@/lib/integrations/meta/connection";
import { debugToken, exchangeCode, MetaTokenError, missingMetaScopes } from "@/lib/integrations/meta/oauth";
import type { ConnectionErrorCode } from "@/lib/onboarding/errors";

/**
 * Vuelta de Facebook (spec §6.3): canjea el código por un token largo, lee con debug_token su
 * vencimiento y permisos reales y lo guarda en Vault. Falta elegir cuenta, página y píxel (O7).
 * Nada pesado aquí: los activos se consultan en O7 (falla 14).
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));
  const user = await sessionUser();
  const check = await finishOAuth(params.get("state") ?? "", "meta", user?.id);
  if (!user) return to("/auth/login?next=/onboarding");

  const failWith = async (code: ConnectionErrorCode, reason: string) => {
    console.warn("[meta/callback]", code, reason);
    await markMetaError(user.id, code);
    return to("/onboarding/meta");
  };

  const code = params.get("code");
  if (params.get("error") || !code) return failWith("denied", params.get("error_reason") ?? "sin code");
  if (!check.ok) return failWith("expired", `state: ${check.reason}`);

  try {
    const token = await exchangeCode(code);
    const info = await debugToken(token);
    if (!info.valid) return failWith("expired", "debug_token: no válido");
    const missing = missingMetaScopes(info.scopes);
    if (missing.length) return failWith("insufficient_scope", missing.join(","));
    await markMetaAuthorized(user.id, token, info);
  } catch (e) {
    if (e instanceof MetaTokenError) return failWith(e.transient ? "unavailable" : "expired", e.message);
    console.error("[meta/callback]", e);
    return failWith("unavailable", "error inesperado");
  }
  return to("/onboarding/meta/accounts");
}
