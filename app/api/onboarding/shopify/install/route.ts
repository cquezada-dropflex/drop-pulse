import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { sessionUser } from "@/lib/integrations/session";
import { getShopifyConnection } from "@/lib/integrations/shopify/connection";
import { isShopDomain, verifyShopifyRequest } from "@/lib/integrations/shopify/oauth";
import { PENDING_SHOP_COOKIE, startShopifyOAuth } from "@/lib/integrations/shopify/start";
import { OnboardingError } from "@/lib/onboarding/types";

/**
 * App URL de Shopify (instalación administrada, spec §5.2). Shopify abre esta ruta con
 * `?hmac&host&shop&timestamp` después de que el comerciante aceptó los permisos: la app ya está
 * instalada y aquí se obtiene el token con el authorization code grant, sin otra pantalla.
 * Pública en el proxy: la autenticidad la da el HMAC, no la sesión.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const shop = params.get("shop");
  if (!isShopDomain(shop) || !verifyShopifyRequest(params)) {
    console.warn("[shopify/install] petición sin firma válida", { shop });
    return new NextResponse("Solicitud de Shopify no válida. Vuelve a abrir DropFlex desde tu Shopify.", { status: 400 });
  }
  const to = (path: string) => NextResponse.redirect(new URL(path, req.url));

  const user = await sessionUser();
  if (!user) {
    // Se retoma después de crear la cuenta o iniciar sesión (/onboarding → /api/onboarding/shopify/resume).
    (await cookies()).set(PENDING_SHOP_COOKIE, shop, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      // Un día: alcanza para confirmar el correo de la cuenta nueva.
      maxAge: 24 * 60 * 60,
    });
    return to("/auth/create-account");
  }

  const current = await getShopifyConnection(user.id);
  if (current?.shop_domain === shop && current.status === "connected") return to("/onboarding");

  try {
    return NextResponse.redirect(await startShopifyOAuth(user.id, shop, { probe: false }));
  } catch (e) {
    if (e instanceof OnboardingError) {
      // Tienda de otra cuenta: se muestra el paso 1 con la dirección puesta; al intentar, sale el error en el campo.
      (await cookies()).set(PENDING_SHOP_COOKIE, shop, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 60 });
      return to("/onboarding/shopify");
    }
    console.error("[shopify/install]", e);
    return to("/onboarding/shopify");
  }
}
