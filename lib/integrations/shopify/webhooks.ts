import "server-only";
import { createHmac } from "node:crypto";
import { adminClient } from "../admin";
import { shopifyEnv } from "../env";
import { safeEqual } from "../oauth-state";
import { findByShop, redactShop, revokeShopify } from "./connection";

// Webhooks de la app (declarados en shopify.app.toml, spec §5.5). HMAC-SHA256 en base64 sobre el
// cuerpo CRUDO con el client secret, como en dropflex (lib/integrations/shopify/webhook.ts).

export function verifyWebhook(rawBody: string, header: string | null): boolean {
  if (!header) return false;
  const expected = createHmac("sha256", shopifyEnv().apiSecret).update(rawBody, "utf8").digest("base64");
  return safeEqual(expected, header);
}

/** Registra el evento; devuelve false si ya se procesó (Shopify reintenta con el mismo id). */
export async function firstDelivery(id: string, topic: string, shop: string | null): Promise<boolean> {
  const { error } = await adminClient().from("webhook_events").insert({ id, provider: "shopify", topic, shop_domain: shop });
  if (error?.code === "23505") return false;
  if (error) throw new Error(`Registrar el webhook: ${error.message}`);
  return true;
}

export async function handleWebhook(topic: string, shop: string) {
  switch (topic) {
    case "app/uninstalled": {
      const conn = await findByShop(shop);
      if (conn) await revokeShopify(conn.user_id);
      return;
    }
    case "shop/redact":
      await redactShop(shop);
      return;
    case "customers/data_request":
    case "customers/redact":
      // DropFlex no guarda datos de clientes (solo cantidades por producto): queda registrado
      // en webhook_events como constancia. Documentarlo en la política de privacidad.
      return;
    default:
      return;
  }
}
