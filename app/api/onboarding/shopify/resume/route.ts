import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/integrations/session";
import { isShopDomain } from "@/lib/integrations/shopify/oauth";
import { PENDING_SHOP_COOKIE, startShopifyOAuth } from "@/lib/integrations/shopify/start";

/** Retoma la instalación que llegó desde Shopify antes del login: arranca el OAuth con esa tienda. */
export async function GET(req: NextRequest) {
  const jar = await cookies();
  const shop = jar.get(PENDING_SHOP_COOKIE)?.value;
  jar.delete(PENDING_SHOP_COOKIE);
  const back = NextResponse.redirect(new URL("/onboarding/shopify", req.url));
  if (!isShopDomain(shop)) return back;
  try {
    const user = await requireUser();
    return NextResponse.redirect(await startShopifyOAuth(user.id, shop, { probe: false }));
  } catch {
    // Tienda de otra cuenta o sesión vencida: el paso 1 muestra el formulario.
    jar.set(PENDING_SHOP_COOKIE, shop, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 30 * 60 });
    return back;
  }
}
