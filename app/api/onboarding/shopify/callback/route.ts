import { NextResponse, type NextRequest } from "next/server";
import { finishOAuth } from "@/lib/integrations/oauth-state";
import { sessionUser } from "@/lib/integrations/session";
import { shopifyRequest, ShopifyAuthError } from "@/lib/integrations/shopify/client";
import { getShopifyConnection, markConnected, markShopifyError } from "@/lib/integrations/shopify/connection";
import { kickImport } from "@/lib/integrations/shopify/import";
import { detectWithToken } from "@/lib/integrations/shopify/market";
import { exchangeCode, isShopDomain, missingScopes, ShopifyTokenError, verifyShopifyRequest } from "@/lib/integrations/shopify/oauth";
import { SHOP_QUERY, type ShopQuery } from "@/lib/integrations/shopify/queries";
import type { ConnectionErrorCode } from "@/lib/onboarding/errors";

/**
 * Vuelta del OAuth de Shopify (spec §5.3): valida HMAC, timestamp, state, nonce y usuario; canjea el
 * código por un token offline que vence; guarda el token en Vault y deja la importación en marcha.
 * Siempre vuelve al Paso 1, que muestra `importing`, `connected` o el error con “Reintentar”.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const back = () => NextResponse.redirect(new URL("/onboarding/shopify", req.url));
  const user = await sessionUser();
  // La cookie del nonce se borra aquí en toda salida.
  const check = await finishOAuth(params.get("state") ?? "", "shopify", user?.id);
  if (!user) return NextResponse.redirect(new URL("/auth/login?next=/onboarding", req.url));

  const failWith = async (code: ConnectionErrorCode, reason: string) => {
    console.warn("[shopify/callback]", code, reason);
    // Cancelar una reautorización no rompe una tienda que ya estaba conectada.
    const current = await getShopifyConnection(user.id);
    if (current && current.status !== "connected") await markShopifyError(user.id, code);
    return back();
  };

  const shop = params.get("shop");
  const code = params.get("code");
  if (params.get("error") || !code) return failWith("denied", params.get("error") ?? "sin code");
  if (!isShopDomain(shop) || !verifyShopifyRequest(params)) return failWith("expired", "hmac, timestamp o tienda");
  if (!check.ok) return failWith("expired", `state: ${check.reason}`);
  // El comerciante puede escribir un dominio antiguo o un alias (datazo-1141.myshopify.com) y Shopify
  // responder con el canónico (qs060z-e7.myshopify.com). El `shop` del callback viene firmado por
  // Shopify (HMAC ya validado) y el state ya ata usuario y nonce: se usa el canónico.
  if (check.state.shop !== shop) console.info("[shopify/callback] dominio canónico distinto del escrito", { escrito: check.state.shop, shop });

  try {
    const token = await exchangeCode(shop, code);
    const missing = missingScopes(token.scopes);
    if (missing.length) return failWith("insufficient_scope", missing.join(","));
    const info = await shopifyRequest<ShopQuery>(shop, token.accessToken, SHOP_QUERY);
    await markConnected(user.id, shop, token, {
      gid: info.shop.id,
      name: info.shop.name,
      currency: info.shop.currencyCode,
      total: info.productsCount?.count ?? 0,
    });
    // País y zona horaria para sugerir el mercado en “Tienda conectada”. Si falla, no rompe la conexión.
    await detectWithToken(user.id, shop, token.accessToken);
  } catch (e) {
    if (e instanceof ShopifyTokenError) return failWith(e.status >= 500 ? "unavailable" : "expired", e.message);
    if (e instanceof ShopifyAuthError) return failWith("insufficient_scope", e.message);
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 409) return failWith("shop_taken", e.message);
    console.error("[shopify/callback]", e);
    return failWith("unavailable", "error inesperado");
  }

  kickImport(await getShopifyConnection(user.id));
  return back();
}
