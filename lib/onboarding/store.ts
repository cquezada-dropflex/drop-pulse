import "server-only";
import { redirect } from "next/navigation";
import { adminClient } from "@/lib/integrations/admin";
import { requireUser, sessionUser, type SessionUser } from "@/lib/integrations/session";
import { getShopifyConnection, type ShopifyConnection } from "@/lib/integrations/shopify/connection";
import { getMetaConnection, type MetaConnection } from "@/lib/integrations/meta/connection";
import { getMarket, type MarketState } from "@/lib/settings/market";
import { connectionErrorText } from "./errors";
import type { ImportStatus, OnboardingState } from "./types";

// Estado del onboarding desde Supabase (docs/spec-migracion-conexiones.md §3.1 y §4):
// - onboarding: selección, números, generación, fin y la tarjeta de Hoy;
// - shopify_connections y meta_connections: el estado de cada conexión.
// Se lee con service_role filtrando por el usuario de la sesión (verificado con getClaims).

interface OnboardingRow {
  user_id: string;
  selected: string[];
  numbers: OnboardingState["numbers"] | null;
  generation: OnboardingState["generation"] | null;
  finished_at: string | null;
  checklist_hidden: boolean;
}

export interface Loaded {
  state: OnboardingState;
  shop: ShopifyConnection | null;
  meta: MetaConnection | null;
}

function shopStatus(c: ShopifyConnection | null, m: MarketState | null): ImportStatus | undefined {
  if (!c) return undefined;
  const market = m ? { ...m.market, confirmed: m.confirmed } : undefined;
  const currency = m?.confirmed ? m.market.currency : (c.currency ?? "");
  const base = { domain: c.shop_domain, imported: c.imported_count, total: c.total_count ?? c.imported_count, currency, market };
  if (c.status === "error" || c.status === "revoked") return { ...base, status: "error", error: connectionErrorText("shopify", c.error_code) };
  if (c.status !== "connected") return { ...base, status: "connecting" };
  const importing = c.import_status === "importing" || c.import_status === "pending";
  return { ...base, status: importing ? "importing" : "connected", total: importing ? Math.max(base.total, c.imported_count) : c.imported_count };
}

function metaStatus(c: MetaConnection | null, finished: boolean): OnboardingState["meta"] {
  if (!c) return finished ? { status: "later" } : undefined;
  switch (c.status) {
    case "connecting":
      return { status: "authorizing" };
    case "action":
      return { status: "action" };
    case "connected":
      return { status: "connected", account: c.ad_account_name ?? undefined, page: c.page_name ?? undefined, pixel: c.pixel_name ?? undefined };
    default:
      return { status: "error", error: connectionErrorText("meta", c.error_code) };
  }
}

export async function loadOnboarding(user: SessionUser): Promise<Loaded> {
  const [row, shop, meta] = await Promise.all([
    adminClient().from("onboarding").select("*").eq("user_id", user.id).maybeSingle(),
    getShopifyConnection(user.id),
    getMetaConnection(user.id),
  ]);
  if (row.error) throw new Error(`Leer el onboarding: ${row.error.message}`);
  const r = row.data as OnboardingRow | null;
  const market = shop?.status === "connected" ? await getMarket(user.id, shop) : null;
  const finishedAt = r?.finished_at ? Date.parse(r.finished_at) : undefined;
  return {
    shop,
    meta,
    state: {
      version: 1,
      userId: user.id,
      account: user.email ? { email: user.email } : undefined,
      shop: shopStatus(shop, market),
      selected: r?.selected ?? [],
      numbers: r?.numbers ?? undefined,
      generation: r?.generation ?? undefined,
      meta: metaStatus(meta, Boolean(finishedAt)),
      finishedAt,
      checklistHidden: r?.checklist_hidden ?? false,
    },
  };
}

/** Para páginas: sin sesión, al login (el proxy ya lo hace; esto es la segunda línea). */
export async function readOnboarding(): Promise<Loaded> {
  const user = await sessionUser();
  if (!user) redirect("/auth/login");
  return loadOnboarding(user);
}

/** Para rutas de API: sin sesión, 401. */
export async function readOnboardingForApi(): Promise<Loaded> {
  return loadOnboarding(await requireUser());
}

/** Guarda la parte del estado que vive en la tabla onboarding (las conexiones se escriben aparte). */
export async function writeOnboarding(state: OnboardingState) {
  const { error } = await adminClient()
    .from("onboarding")
    .upsert(
      {
        user_id: state.userId,
        selected: state.selected,
        numbers: state.numbers ?? null,
        generation: state.generation ?? null,
        finished_at: state.finishedAt ? new Date(state.finishedAt).toISOString() : null,
        checklist_hidden: state.checklistHidden,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (error) throw new Error(`Guardar el onboarding: ${error.message}`);
}
