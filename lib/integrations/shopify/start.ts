import "server-only";
import { OnboardingError } from "@/lib/onboarding/types";
import { beginOAuth } from "../oauth-state";
import { assertShopAvailable, markConnecting } from "./connection";
import { authorizeUrl, normalizeShop, shopExists } from "./oauth";

/**
 * Inicio común del OAuth de Shopify (O2, lanzamiento desde Shopify y retomar tras el login):
 * valida la tienda, que no sea de otro comerciante, deja la conexión `connecting` y firma el state.
 */
export async function startShopifyOAuth(userId: string, shopInput: string, opts: { probe: boolean }): Promise<string> {
  const shop = normalizeShop(shopInput);
  if (opts.probe && !(await shopExists(shop))) throw new OnboardingError("No encontramos esa tienda. Revisa la dirección.", 404, "shop");
  await assertShopAvailable(userId, shop);
  await markConnecting(userId, shop);
  const state = await beginOAuth("shopify", userId, { shop });
  return authorizeUrl(shop, state);
}

/** Tienda que llegó desde Shopify antes de que hubiera sesión (se retoma después del login). */
export const PENDING_SHOP_COOKIE = "df_pending_shop";
