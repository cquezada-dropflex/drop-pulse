import "server-only";
import { shopifyEnv } from "../env";
import { getToken } from "../tokens";
import { refreshAccessToken, ShopifyTokenError } from "./oauth";
import { markShopifyError, saveRefreshedToken, type ShopifyConnection } from "./connection";

// Cliente GraphQL del Admin API. Portado de dropflex (lib/integrations/shopify/client.ts):
// backoff con jitter en 429/5xx, THROTTLED dentro de un 200 con el restoreRate del leaky bucket y
// ACCESS_DENIED / 401 / 403 como error de autenticación. Correcciones (falla 10 del spec):
// solo se reintentan LECTURAS (una mutación puede aplicarse y fallar la respuesta) y hay timeout.
// Además renueva el token offline que vence antes de usarlo.

const MAX_RETRIES = 4;
const BASE_DELAY_MS = 500;
const TIMEOUT_MS = 15_000;
const REFRESH_MARGIN_MS = 5 * 60 * 1000;

export class ShopifyAuthError extends Error {}
export class ShopifyApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

interface GraphQLResponse<T> {
  data?: T | null;
  errors?: { message: string; extensions?: { code?: string } }[];
  extensions?: { cost?: { requestedQueryCost?: number; throttleStatus?: { currentlyAvailable: number; restoreRate: number } } };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (attempt: number) => Math.random() * BASE_DELAY_MS * 2 ** attempt;

function throttleDelay(ext: GraphQLResponse<unknown>["extensions"]): number {
  const s = ext?.cost?.throttleStatus;
  if (!s || s.restoreRate <= 0) return BASE_DELAY_MS;
  const needed = (ext?.cost?.requestedQueryCost ?? 0) - s.currentlyAvailable;
  return needed <= 0 ? BASE_DELAY_MS : Math.ceil((needed / s.restoreRate) * 1000);
}

// Un refresco por usuario a la vez dentro de la misma instancia.
const refreshing = new Map<string, Promise<string>>();

async function accessToken(conn: ShopifyConnection): Promise<string> {
  const expiresAt = conn.token_expires_at ? Date.parse(conn.token_expires_at) : null;
  if (expiresAt === null || expiresAt - Date.now() > REFRESH_MARGIN_MS) {
    const token = await getToken("shopify", conn.user_id);
    if (!token) throw new ShopifyAuthError("Sin token de Shopify");
    return token;
  }
  const inFlight = refreshing.get(conn.user_id);
  if (inFlight) return inFlight;
  const job = (async () => {
    const refresh = await getToken("shopify_refresh", conn.user_id);
    if (!refresh) throw new ShopifyAuthError("Sin refresh token de Shopify");
    try {
      const token = await refreshAccessToken(conn.shop_domain, refresh);
      await saveRefreshedToken(conn.user_id, token);
      return token.accessToken;
    } catch (e) {
      if (e instanceof ShopifyTokenError && e.status >= 400 && e.status < 500) {
        await markShopifyError(conn.user_id, "expired");
        throw new ShopifyAuthError("El refresh token de Shopify ya no sirve");
      }
      throw e;
    }
  })().finally(() => refreshing.delete(conn.user_id));
  refreshing.set(conn.user_id, job);
  return job;
}

/**
 * Ejecuta una consulta de LECTURA. Para mutaciones habrá que agregar una variante sin reintentos
 * de transporte (la etapa de publicar, fuera del alcance del onboarding).
 */
export async function shopifyQuery<T>(conn: ShopifyConnection, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  return shopifyRequest<T>(conn.shop_domain, await accessToken(conn), query, variables);
}

/** Lo mismo con un token en mano (el callback, antes de guardar la conexión). */
export async function shopifyRequest<T>(shop: string, token: string, query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { apiVersion } = shopifyEnv();
  const url = `https://${shop}/admin/api/${apiVersion}/graphql.json`;

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "X-Shopify-Access-Token": token, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (e) {
      if (attempt >= MAX_RETRIES) throw new ShopifyApiError(`Shopify no respondió: ${(e as Error).message}`);
      await sleep(jitter(attempt));
      continue;
    }

    if (res.status === 401 || res.status === 403) throw new ShopifyAuthError(`Shopify respondió ${res.status}`);
    if (res.status === 429 || res.status >= 500) {
      if (attempt >= MAX_RETRIES) throw new ShopifyApiError(`Shopify respondió ${res.status}`, res.status);
      const retryAfter = Number(res.headers.get("Retry-After"));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : jitter(attempt));
      continue;
    }
    if (!res.ok) throw new ShopifyApiError(`Shopify respondió ${res.status}`, res.status);

    const body = (await res.json()) as GraphQLResponse<T>;
    const codes = body.errors?.map((e) => e.extensions?.code) ?? [];
    if (codes.includes("THROTTLED")) {
      if (attempt >= MAX_RETRIES) throw new ShopifyApiError("Shopify limitó las consultas", 429);
      await sleep(throttleDelay(body.extensions));
      continue;
    }
    if (codes.includes("ACCESS_DENIED")) throw new ShopifyAuthError(body.errors!.map((e) => e.message).join("; "));
    if (body.errors?.length || !body.data) throw new ShopifyApiError(body.errors?.map((e) => e.message).join("; ") ?? "Respuesta vacía de Shopify");
    return body.data;
  }
}
