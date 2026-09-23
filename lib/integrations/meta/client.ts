import "server-only";
import { createHmac } from "node:crypto";
import { metaEnv } from "../env";

// Cliente de la Graph API. Portado de dropflex (lib/ads/meta/client.ts) con las correcciones del spec
// (fallas 12, 15 y 18): versión desde META_GRAPH_VERSION, appsecret_proof en cada llamada, timeout,
// solo se reintentan GET, el código 100 es un error de parámetros (no “no existe”) y un 403 sin código
// de autenticación es falta de permiso, no un token vencido.

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;
const TIMEOUT_MS = 15_000;
const MAX_PAGES = 20;

const AUTH_CODES = new Set([190, 102, 463, 467]);
const PERMISSION_CODES = new Set([10, 200, 272, 294, 299]);
const THROTTLE_CODES = new Set([4, 17, 32, 341, 613]);

/** Token inválido, vencido o revocado: hay que volver a conectar. */
export class MetaAuthError extends Error {}
/** Falta un permiso para esa llamada. */
export class MetaPermissionError extends Error {}
export class MetaApiError extends Error {
  constructor(message: string, public status?: number, public code?: number) {
    super(message);
  }
}

interface MetaError {
  error?: { message?: string; code?: number; is_transient?: boolean };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (attempt: number) => Math.random() * BASE_DELAY_MS * 2 ** attempt;

export function graphUrl(path: string): URL {
  return new URL(`https://graph.facebook.com/${metaEnv().graphVersion}${path}`);
}

export function appSecretProof(token: string): string {
  return createHmac("sha256", metaEnv().appSecret).update(token).digest("hex");
}

function mapError(status: number, body: MetaError): Error {
  const code = body.error?.code;
  const msg = body.error?.message ?? `Meta respondió ${status}`;
  if (code != null && AUTH_CODES.has(code)) return new MetaAuthError(msg);
  if (code != null && PERMISSION_CODES.has(code)) return new MetaPermissionError(msg);
  if (status === 401) return new MetaAuthError(msg);
  if (status === 403) return new MetaPermissionError(msg);
  return new MetaApiError(msg, status, code);
}

export async function graphGet<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T> {
  const url = path.startsWith("https://") ? new URL(path) : graphUrl(path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  url.searchParams.set("appsecret_proof", appSecretProof(token));

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      if (attempt >= MAX_RETRIES) throw new MetaApiError(`Meta no respondió: ${(e as Error).message}`);
      await sleep(jitter(attempt));
      continue;
    }
    const body = (await res.json().catch(() => ({}))) as T & MetaError;
    const failed = !res.ok || body.error != null;
    if (!failed) return body;
    const code = body.error?.code;
    const retryable = res.status === 429 || res.status >= 500 || (code != null && THROTTLE_CODES.has(code)) || Boolean(body.error?.is_transient);
    if (retryable && attempt < MAX_RETRIES) {
      await sleep(jitter(attempt));
      continue;
    }
    throw mapError(res.status, body);
  }
}

/** Sigue `paging.next` hasta MAX_PAGES (dropflex solo leía la primera página: falla 13). */
export async function graphList<T>(token: string, path: string, params: Record<string, string> = {}): Promise<T[]> {
  const out: T[] = [];
  let page = await graphGet<{ data?: T[]; paging?: { next?: string } }>(token, path, { limit: "100", ...params });
  for (let i = 0; ; i++) {
    out.push(...(page.data ?? []));
    const next = page.paging?.next;
    if (!next || i + 1 >= MAX_PAGES) break;
    // `next` ya trae access_token; graphGet lo reemplaza y agrega appsecret_proof.
    page = await graphGet(token, next);
  }
  return out;
}
