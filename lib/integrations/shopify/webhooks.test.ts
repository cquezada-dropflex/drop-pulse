import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhook } from "./webhooks";

describe("verifyWebhook", () => {
  const body = JSON.stringify({ shop_domain: "mitienda.myshopify.com" });
  const sig = createHmac("sha256", "shopify-secret").update(body, "utf8").digest("base64");

  it("acepta el HMAC del cuerpo crudo", () => expect(verifyWebhook(body, sig)).toBe(true));
  it("rechaza un cuerpo cambiado", () => expect(verifyWebhook(body + " ", sig)).toBe(false));
  it("rechaza sin encabezado", () => expect(verifyWebhook(body, null)).toBe(false));
});
