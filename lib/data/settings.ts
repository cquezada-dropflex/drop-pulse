// Supuestos del comerciante (Ajustes). Los supuestos, valores de ejemplo; el mercado, de Supabase.
import "server-only";
import { sessionUser } from "@/lib/integrations/session";
import { getShopifyConnection } from "@/lib/integrations/shopify/connection";
import { getMarket } from "@/lib/settings/market";
import type { Assumptions } from "@/lib/types";

export async function getAssumptions(): Promise<Assumptions> {
  return { deliveryRate: 80, maxCpa: 6000, store: "tutienda.cl", metaAccount: "Cuenta publicitaria de Meta" };
}

/** Mercado del comerciante; null sin Shopify conectado (no hay de dónde detectarlo). */
export async function getMarketSettings() {
  const user = await sessionUser();
  if (!user) return null;
  const conn = await getShopifyConnection(user.id);
  if (!conn || conn.status !== "connected") return null;
  const { market, confirmed } = await getMarket(user.id, conn);
  return { value: { countryCode: market.countryCode, currency: market.currency, language: market.language }, confirmed };
}
