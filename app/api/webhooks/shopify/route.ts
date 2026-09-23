import { NextResponse, after } from "next/server";
import { firstDelivery, handleWebhook, verifyWebhook } from "@/lib/integrations/shopify/webhooks";

/**
 * Webhooks de la app declarados en shopify.app.toml: app/uninstalled y los tres GDPR obligatorios
 * (spec §5.5). HMAC sobre el cuerpo crudo; idempotentes por X-Shopify-Webhook-Id; se responde rápido
 * y se procesa después. Pública en el proxy.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-shopify-hmac-sha256"))) {
    return NextResponse.json({ error: "HMAC no válido" }, { status: 401 });
  }
  const topic = req.headers.get("x-shopify-topic") ?? "";
  const shop = req.headers.get("x-shopify-shop-domain") ?? "";
  const id = req.headers.get("x-shopify-webhook-id") ?? req.headers.get("x-shopify-event-id");
  if (!id || !topic) return NextResponse.json({ ok: true });

  try {
    if (!(await firstDelivery(id, topic, shop || null))) return NextResponse.json({ ok: true, duplicate: true });
  } catch (e) {
    console.error("[webhooks/shopify]", e);
    // 500: Shopify reintenta más tarde.
    return NextResponse.json({ error: "No pudimos registrar el evento" }, { status: 500 });
  }
  after(() => handleWebhook(topic, shop).catch((e) => console.error("[webhooks/shopify]", topic, shop, e)));
  return NextResponse.json({ ok: true });
}
