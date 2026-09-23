import { NextResponse } from "next/server";
import { cronSecret } from "@/lib/integrations/env";
import { safeEqual } from "@/lib/integrations/oauth-state";
import { connectedMetaConnections, markMetaError, metaToken } from "@/lib/integrations/meta/connection";
import { debugToken, MetaTokenError } from "@/lib/integrations/meta/oauth";

const EXPIRY_MARGIN_MS = 7 * 86_400_000;

/**
 * Revisión diaria de Meta (vercel.json › crons, spec §6.6): un token inválido o que vence en menos
 * de 7 días pasa a `error` y Hoy y Ajustes piden “Volver a conectar”. No se intenta refrescar el
 * token largo (falla 15) y un error transitorio de Meta no cambia nada.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${cronSecret()}`)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const result = { checked: 0, expired: 0, skipped: 0 };
  for (const conn of await connectedMetaConnections()) {
    result.checked++;
    try {
      const token = await metaToken(conn.user_id);
      const info = token ? await debugToken(token) : null;
      const expiring = info?.expiresAt && info.expiresAt.getTime() - Date.now() < EXPIRY_MARGIN_MS;
      const dataExpiring = info?.dataAccessExpiresAt && info.dataAccessExpiresAt.getTime() - Date.now() < EXPIRY_MARGIN_MS;
      if (!info || !info.valid || expiring || dataExpiring) {
        await markMetaError(conn.user_id, "expired");
        result.expired++;
      }
    } catch (e) {
      if (!(e instanceof MetaTokenError && e.transient)) console.error("[cron/connections]", conn.user_id, e);
      result.skipped++;
    }
  }
  return NextResponse.json(result);
}
