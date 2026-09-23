import "server-only";
import { adminClient } from "@/lib/integrations/admin";
import { detectForConnection } from "@/lib/integrations/shopify/market";
import type { ShopifyConnection } from "@/lib/integrations/shopify/connection";
import { detectMarket, type Market } from "@/lib/market";

// El mercado del comerciante (merchant_settings). Mientras no lo confirma, vale el que se detectó en
// Shopify: la IA nunca se queda sin país, moneda ni idioma.

export interface MarketState {
  market: Market;
  /** El comerciante lo confirmó (en “Tienda conectada” o en Ajustes). */
  confirmed: boolean;
}

interface SettingsRow {
  country_code: string;
  currency: string;
  language: string;
  timezone: string | null;
  market_confirmed_at: string | null;
}

async function readSettings(userId: string): Promise<SettingsRow | null> {
  const { data, error } = await adminClient()
    .from("merchant_settings")
    .select("country_code, currency, language, timezone, market_confirmed_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`Leer el mercado: ${error.message}`);
  return data as SettingsRow | null;
}

/** Mercado confirmado o, si falta, el sugerido con lo que Shopify sabe de la tienda. */
export async function getMarket(userId: string, conn: ShopifyConnection | null): Promise<MarketState> {
  const row = await readSettings(userId);
  if (row?.market_confirmed_at) {
    return {
      confirmed: true,
      market: { countryCode: row.country_code, currency: row.currency, language: row.language, timezone: row.timezone },
    };
  }
  const detected = conn ? await detectForConnection(conn) : { countryCode: null, currency: null, timezone: null };
  return { confirmed: false, market: detectMarket(detected) };
}

export async function saveMarket(userId: string, market: Market) {
  const now = new Date().toISOString();
  const { error } = await adminClient()
    .from("merchant_settings")
    .upsert(
      {
        user_id: userId,
        country_code: market.countryCode,
        currency: market.currency,
        language: market.language,
        timezone: market.timezone ?? null,
        market_confirmed_at: now,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`Guardar el mercado: ${error.message}`);
}
