import "server-only";
import { adminClient } from "../admin";
import { shopifyQuery, shopifyRequest } from "./client";
import type { ShopifyConnection } from "./connection";
import { SHOP_MARKET_QUERY, type ShopMarketQuery } from "./queries";

// País y zona horaria que Shopify tiene para la tienda. Se guardan en shopify_connections como
// “detectado”; lo que usa la IA es lo que el comerciante confirma (lib/settings/market.ts).

export interface DetectedShop {
  countryCode: string | null;
  currency: string | null;
  timezone: string | null;
}

function toDetected(data: ShopMarketQuery): DetectedShop {
  const code = data.shop.billingAddress?.countryCodeV2?.toUpperCase() ?? null;
  return {
    countryCode: code && /^[A-Z]{2}$/.test(code) ? code : null,
    currency: data.shop.currencyCode ?? null,
    timezone: data.shop.ianaTimezone ?? null,
  };
}

async function save(userId: string, d: DetectedShop) {
  const { error } = await adminClient()
    .from("shopify_connections")
    .update({ country_code: d.countryCode, timezone: d.timezone, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw new Error(`Guardar el mercado detectado: ${error.message}`);
}

/** En el callback, con el token recién canjeado. Nunca hace fallar la conexión. */
export async function detectWithToken(userId: string, shop: string, token: string): Promise<DetectedShop | null> {
  try {
    const d = toDetected(await shopifyRequest<ShopMarketQuery>(shop, token, SHOP_MARKET_QUERY));
    await save(userId, d);
    return d;
  } catch (e) {
    console.warn("[shopify/market] no se pudo detectar el mercado", e);
    return null;
  }
}

/** Un intento fallido no se repite en cada sondeo del onboarding (cada 1,5 s): se espera un rato. */
const RETRY_MS = 10 * 60 * 1000;
const lastAttempt = new Map<string, number>();

/** Para conexiones anteriores a la detección: se consulta una vez y queda guardado. */
export async function detectForConnection(conn: ShopifyConnection): Promise<DetectedShop> {
  // La zona horaria siempre viene: si está, la detección ya corrió (aunque Shopify no tuviera país).
  if (conn.country_code || conn.timezone) return { countryCode: conn.country_code, currency: conn.currency, timezone: conn.timezone };
  const fallback = { countryCode: null, currency: conn.currency, timezone: null };
  if (conn.status !== "connected") return fallback;
  if (Date.now() - (lastAttempt.get(conn.user_id) ?? 0) < RETRY_MS) return fallback;
  lastAttempt.set(conn.user_id, Date.now());
  try {
    const d = toDetected(await shopifyQuery<ShopMarketQuery>(conn, SHOP_MARKET_QUERY));
    await save(conn.user_id, d);
    return d;
  } catch (e) {
    console.warn("[shopify/market] no se pudo detectar el mercado", e);
    return fallback;
  }
}
