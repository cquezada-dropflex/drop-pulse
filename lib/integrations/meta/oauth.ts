import "server-only";
import { metaEnv } from "../env";
import { appSecretProof, graphUrl } from "./client";

// Login de Meta (spec §6.1–6.3). Dos modos, según META_LOGIN_CONFIG_ID:
// - con él, Facebook Login for Business (`config_id`, app de tipo Business);
// - sin él, el login clásico con la lista de permisos en `scope`, como dropflex (lib/ads/meta/oauth.ts).
// En ambos: `rerequest` al reconectar, vencimiento y permisos reales con debug_token y sin “refrescar”
// el token largo (falla 15).

/** Permisos que deben quedar concedidos: los pide `scope` (clásico) o la configuración de FLfB. */
export const META_REQUIRED_SCOPES = ["ads_read", "ads_management", "business_management", "pages_show_list"] as const;

const TIMEOUT_MS = 15_000;

export class MetaTokenError extends Error {
  constructor(message: string, public transient: boolean) {
    super(message);
  }
}

export function authorizeUrl(state: string, rerequest: boolean): string {
  const { appId, configId, graphVersion, redirectUri } = metaEnv();
  const url = new URL(`https://www.facebook.com/${graphVersion}/dialog/oauth`);
  url.searchParams.set("client_id", appId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  if (configId) {
    url.searchParams.set("config_id", configId);
    url.searchParams.set("override_default_response_type", "true");
  } else {
    url.searchParams.set("scope", META_REQUIRED_SCOPES.join(","));
  }
  if (rerequest) url.searchParams.set("auth_type", "rerequest");
  return url.toString();
}

async function tokenGet(params: Record<string, string>): Promise<{ accessToken: string; expiresIn: number | null }> {
  const url = graphUrl("/oauth/access_token");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new MetaTokenError(`Meta no respondió: ${(e as Error).message}`, true);
  }
  // Un 5xx de Meta es transitorio: no se trata como “cancelado” ni se pide volver a conectar.
  if (!res.ok) throw new MetaTokenError(`Meta respondió ${res.status} al canjear el código`, res.status >= 500);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new MetaTokenError("Meta no devolvió un token", false);
  return { accessToken: data.access_token, expiresIn: data.expires_in ?? null };
}

/** code → token corto → token largo (~60 días). Nunca se loguea el token. */
export async function exchangeCode(code: string): Promise<string> {
  const { appId, appSecret, redirectUri } = metaEnv();
  const short = await tokenGet({ client_id: appId, client_secret: appSecret, redirect_uri: redirectUri, code });
  const long = await tokenGet({ grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: short.accessToken });
  return long.accessToken;
}

export interface TokenInfo {
  valid: boolean;
  userId: string | null;
  expiresAt: Date | null;
  dataAccessExpiresAt: Date | null;
  scopes: string[];
}

/** Vencimiento y permisos reales del token, con el token de la app (id|secret). */
export async function debugToken(token: string): Promise<TokenInfo> {
  const { appId, appSecret } = metaEnv();
  const url = graphUrl("/debug_token");
  url.searchParams.set("input_token", token);
  url.searchParams.set("access_token", `${appId}|${appSecret}`);
  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (e) {
    throw new MetaTokenError(`Meta no respondió: ${(e as Error).message}`, true);
  }
  if (!res.ok) throw new MetaTokenError(`Meta respondió ${res.status} a debug_token`, res.status >= 500);
  const { data } = (await res.json()) as {
    data?: { is_valid?: boolean; user_id?: string; expires_at?: number; data_access_expires_at?: number; scopes?: string[] };
  };
  const date = (s?: number) => (s ? new Date(s * 1000) : null);
  return {
    valid: Boolean(data?.is_valid),
    userId: data?.user_id ?? null,
    // expires_at = 0 significa “no vence”.
    expiresAt: date(data?.expires_at),
    dataAccessExpiresAt: date(data?.data_access_expires_at),
    scopes: data?.scopes ?? [],
  };
}

export function missingMetaScopes(granted: string[]): string[] {
  const has = new Set(granted);
  return META_REQUIRED_SCOPES.filter((s) => !has.has(s));
}

/** “Desconectar”: quita todos los permisos de la app para ese usuario. Mejor esfuerzo. */
export async function revokePermissions(token: string): Promise<void> {
  const url = graphUrl("/me/permissions");
  url.searchParams.set("access_token", token);
  url.searchParams.set("appsecret_proof", appSecretProof(token));
  await fetch(url, { method: "DELETE", signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => {});
}
