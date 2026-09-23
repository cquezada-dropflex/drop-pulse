import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { stateSecret } from "./env";

// `state` de OAuth firmado (portado de dropflex: lib/integrations/shopify/oauth.ts signState/validateCallbackState).
// Diferencias: lleva `purpose` para que un state de Shopify no sirva en Meta (falla 20 del spec), el nonce
// se compara en tiempo constante y la cookie se borra en toda salida del callback (falla 11).

export type OAuthPurpose = "shopify" | "meta";

export interface OAuthState {
  purpose: OAuthPurpose;
  uid: string;
  nonce: string;
  iat: number;
  /** Solo Shopify: la tienda a la que se pidió autorización. */
  shop?: string;
}

const TTL_MS = 10 * 60 * 1000;
const COOKIE: Record<OAuthPurpose, string> = { shopify: "df_oauth_shopify", meta: "df_oauth_meta" };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64url");
const sign = (payload: string) => createHmac("sha256", stateSecret()).update(payload).digest("base64url");

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function signState(state: OAuthState): string {
  const payload = b64(JSON.stringify(state));
  return `${payload}.${sign(payload)}`;
}

export type StateCheck = { ok: true; state: OAuthState } | { ok: false; reason: string };

/** Valida firma, forma, propósito y vigencia. El nonce y el usuario se comparan aparte. */
export function verifyState(raw: string, purpose: OAuthPurpose, now = Date.now()): StateCheck {
  const [payload, mac] = raw.split(".");
  if (!payload || !mac || !safeEqual(sign(payload), mac)) return { ok: false, reason: "firma" };
  let parsed: Partial<OAuthState>;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "forma" };
  }
  if (typeof parsed.uid !== "string" || typeof parsed.nonce !== "string" || typeof parsed.iat !== "number") {
    return { ok: false, reason: "forma" };
  }
  if (parsed.purpose !== purpose) return { ok: false, reason: "propósito" };
  if (now - parsed.iat > TTL_MS || parsed.iat - now > 60_000) return { ok: false, reason: "vencido" };
  return { ok: true, state: parsed as OAuthState };
}

/** Genera el nonce, lo guarda en su cookie httpOnly y devuelve el state firmado. */
export async function beginOAuth(purpose: OAuthPurpose, uid: string, extra?: { shop?: string }): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  (await cookies()).set(COOKIE[purpose], nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000,
  });
  return signState({ purpose, uid, nonce, iat: Date.now(), ...extra });
}

/**
 * Valida el state del callback contra la cookie y el usuario de la sesión, y borra la cookie siempre.
 * Devuelve el state o el motivo del rechazo (solo para el log; al usuario le llega “La autorización venció”).
 */
export async function finishOAuth(raw: string, purpose: OAuthPurpose, uid: string | undefined): Promise<StateCheck> {
  const jar = await cookies();
  const nonce = jar.get(COOKIE[purpose])?.value;
  jar.delete(COOKIE[purpose]);
  const check = verifyState(raw, purpose);
  if (!check.ok) return check;
  if (!nonce || !safeEqual(nonce, check.state.nonce)) return { ok: false, reason: "nonce" };
  if (!uid || uid !== check.state.uid) return { ok: false, reason: "usuario" };
  return check;
}
