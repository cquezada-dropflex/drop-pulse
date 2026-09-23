import "server-only";
import type { ConnectionErrorCode } from "@/lib/onboarding/errors";
import { adminClient } from "../admin";
import { deleteToken, getToken, setToken } from "../tokens";
import type { TokenInfo } from "./oauth";

// Fila de meta_connections: un token por comerciante (no uno por cuenta publicitaria, falla 13)
// y la cuenta, página y píxel que eligió. Todo con service_role.

export interface MetaConnection {
  user_id: string;
  fb_user_id: string | null;
  status: "connecting" | "action" | "connected" | "error" | "revoked";
  error_code: string | null;
  scopes: string[];
  token_expires_at: string | null;
  data_access_expires_at: string | null;
  ad_account_id: string | null;
  ad_account_name: string | null;
  ad_account_currency: string | null;
  page_id: string | null;
  page_name: string | null;
  pixel_id: string | null;
  pixel_name: string | null;
  connected_at: string | null;
}

const TABLE = "meta_connections";
const now = () => new Date().toISOString();

function fail(what: string, error: { message: string } | null) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export async function getMetaConnection(userId: string): Promise<MetaConnection | null> {
  const { data, error } = await adminClient().from(TABLE).select("*").eq("user_id", userId).maybeSingle();
  fail("Leer la conexión de Meta", error);
  return data as MetaConnection | null;
}

export async function markMetaConnecting(userId: string) {
  const { error } = await adminClient()
    .from(TABLE)
    .upsert({ user_id: userId, status: "connecting", error_code: null, updated_at: now() }, { onConflict: "user_id" });
  fail("Guardar la conexión de Meta", error);
}

export async function markMetaError(userId: string, code: ConnectionErrorCode) {
  const { error } = await adminClient()
    .from(TABLE)
    .upsert({ user_id: userId, status: "error", error_code: code, updated_at: now() }, { onConflict: "user_id" });
  fail("Guardar el error de Meta", error);
}

/** Token guardado: falta elegir cuenta, página y píxel (ConnectionCard `action`). */
export async function markMetaAuthorized(userId: string, token: string, info: TokenInfo) {
  await setToken("meta", userId, token);
  const { error } = await adminClient()
    .from(TABLE)
    .upsert(
      {
        user_id: userId,
        fb_user_id: info.userId,
        status: "action",
        error_code: null,
        scopes: info.scopes,
        token_expires_at: info.expiresAt?.toISOString() ?? null,
        data_access_expires_at: info.dataAccessExpiresAt?.toISOString() ?? null,
        updated_at: now(),
      },
      { onConflict: "user_id" },
    );
  fail("Guardar la conexión de Meta", error);
}

export async function saveMetaSelection(
  userId: string,
  sel: { accountId: string; accountName: string; currency: string; pageId: string; pageName: string; pixelId: string; pixelName: string },
) {
  const { error } = await adminClient()
    .from(TABLE)
    .update({
      status: "connected",
      error_code: null,
      ad_account_id: sel.accountId,
      ad_account_name: sel.accountName,
      ad_account_currency: sel.currency,
      page_id: sel.pageId,
      page_name: sel.pageName,
      pixel_id: sel.pixelId,
      pixel_name: sel.pixelName,
      connected_at: now(),
      updated_at: now(),
    })
    .eq("user_id", userId);
  fail("Guardar la cuenta de Meta", error);
}

export async function metaToken(userId: string) {
  return getToken("meta", userId);
}

/** Desautorización desde Facebook: sin token, estado `revoked` (Hoy y Ajustes piden volver a conectar). */
export async function revokeMetaByFbUser(fbUserId: string): Promise<string[]> {
  const { data, error } = await adminClient().from(TABLE).select("user_id").eq("fb_user_id", fbUserId);
  fail("Buscar la conexión de Meta", error);
  const ids = (data ?? []).map((r) => r.user_id as string);
  for (const id of ids) {
    await deleteToken("meta", id);
    fail("Marcar Meta como desconectada", (await adminClient().from(TABLE).update({ status: "revoked", error_code: "revoked", updated_at: now() }).eq("user_id", id)).error);
  }
  return ids;
}

/** “Desconectar” o borrado de datos: se va el token y la fila (Meta vuelve a quedar pendiente). */
export async function deleteMetaConnection(userId: string) {
  await deleteToken("meta", userId);
  fail("Borrar la conexión de Meta", (await adminClient().from(TABLE).delete().eq("user_id", userId)).error);
}

export async function connectedMetaConnections(): Promise<MetaConnection[]> {
  const { data, error } = await adminClient().from(TABLE).select("*").in("status", ["connected", "action"]);
  fail("Listar conexiones de Meta", error);
  return (data ?? []) as MetaConnection[];
}
