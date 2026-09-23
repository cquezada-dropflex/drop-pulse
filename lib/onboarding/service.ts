// Maqueta del backend de onboarding. Funciones puras sobre el estado: reciben el estado y la hora
// actual y devuelven el nuevo estado o lo derivado. Las usan tanto las rutas de app/api/onboarding
// como las páginas del servidor. En producción se reemplazan por llamadas a Shopify, Meta y la base.
import { CATALOG, findProduct, recommended } from "./catalog";
import {
  OnboardingError,
  type CatalogProduct,
  type GenerationStatus,
  type ImportStatus,
  type MetaAssets,
  type Numbers,
  type OnboardingSnapshot,
  type OnboardingState,
  type StepKey,
} from "./types";

export const PLAN_LIMIT = 10;
export const CURRENCY = "CLP";
/** La maqueta importa los 128 productos en 24 s. */
const IMPORT_MS = 24_000;
/** El primer producto tarda 8 s; los siguientes, 18 s cada uno, en cola. */
const FIRST_MS = 8_000;
const NEXT_MS = 18_000;
/** Productos que la maqueta hace fallar, para mostrar el estado de error. */
const FAILS: Record<string, string> = { "masajeador-de-cuello": "No pudimos leer las imágenes" };

export const EMPTY: OnboardingState = { version: 1 };

// ---------- Cuenta ----------

export function createAccount(state: OnboardingState, email: string, now: number): OnboardingState {
  const clean = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new OnboardingError("Ese correo no parece válido. Revisa que esté bien escrito.", 400, "email");
  return { ...state, account: { email: clean, createdAt: now } };
}

// ---------- Shopify ----------

/** “mitienda”, “mitienda.myshopify.com” o la URL completa → “mitienda.myshopify.com”. */
export function normalizeShop(input: string): string {
  const raw = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/\.myshopify\.com$/, "");
  if (!raw) throw new OnboardingError("Escribe la dirección de tu tienda.", 400, "shop");
  if (!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(raw)) throw new OnboardingError("Usa solo letras, números y guiones, como en mitienda.myshopify.com.", 400, "shop");
  // La maqueta no encuentra tiendas con estos nombres (en producción: la respuesta de Shopify).
  if (/noexiste|otratienda/.test(raw)) throw new OnboardingError("No encontramos esa tienda. Revisa la dirección.", 404, "shop");
  return `${raw}.myshopify.com`;
}

/** Inicia el OAuth: devuelve la URL de autorización (en la maqueta, una página de simulación). */
export function startShopify(state: OnboardingState, shopInput: string, nonce: string): { state: OnboardingState; authorizeUrl: string } {
  const domain = normalizeShop(shopInput);
  const params = new URLSearchParams({ shop: domain, state: nonce });
  return {
    state: { ...state, shop: { domain, status: "connecting", nonce } },
    authorizeUrl: `/simulacion/shopify?${params}`,
  };
}

export function finishShopify(state: OnboardingState, q: { shop: string; nonce: string; result: string }, now: number): OnboardingState {
  if (!state.shop || state.shop.nonce !== q.nonce || state.shop.domain !== q.shop) {
    return { ...state, shop: { domain: q.shop, status: "error", error: "La autorización venció. Vuelve a conectar tu tienda." } };
  }
  if (q.result !== "ok") {
    return { ...state, shop: { domain: q.shop, status: "error", error: "Cancelaste la autorización en Shopify. Vuelve a intentarlo cuando quieras." } };
  }
  return { ...state, shop: { domain: q.shop, status: "connected", connectedAt: now } };
}

export function importStatus(state: OnboardingState, now: number): ImportStatus | undefined {
  const s = state.shop;
  if (!s) return undefined;
  const total = CATALOG.length;
  if (s.status !== "connected" || !s.connectedAt) return { status: s.status, domain: s.domain, imported: 0, total, currency: CURRENCY, error: s.error };
  const imported = Math.min(total, Math.floor(((now - s.connectedAt) / IMPORT_MS) * total));
  return { status: imported < total ? "importing" : "connected", domain: s.domain, imported, total, currency: CURRENCY };
}

// ---------- Productos ----------

/** Lo ya importado (la importación no bloquea: los recomendados se calculan con lo que llegó). */
export function importedProducts(state: OnboardingState, now: number): CatalogProduct[] {
  const st = importStatus(state, now);
  if (!st || (st.status !== "importing" && st.status !== "connected")) return [];
  // Siempre llegan primero los más vendidos, para que la recomendación salga desde el primer momento.
  return CATALOG.slice(0, Math.max(st.imported, Math.min(5, CATALOG.length)));
}

export function productLists(state: OnboardingState, now: number) {
  const all = importedProducts(state, now);
  const rec = recommended(all);
  return { recommended: rec, all, total: CATALOG.length, defaultSelection: rec.slice(0, 3).map((p) => p.id) };
}

export function saveSelection(state: OnboardingState, ids: string[]): OnboardingState {
  const unique = [...new Set(ids)].filter((id) => findProduct(id));
  if (!unique.length) throw new OnboardingError("Elige al menos un producto para empezar.", 400, "ids");
  if (unique.length > PLAN_LIMIT) throw new OnboardingError(`Tu plan incluye ${PLAN_LIMIT} productos al mes. Quita ${unique.length - PLAN_LIMIT} para seguir.`, 400, "ids");
  return { ...state, selected: unique };
}

// ---------- Tus números ----------

/** Valores sugeridos: la entrega sale de los pedidos de Shopify (se marca con el destello). */
export function suggestedNumbers(): Numbers {
  return { deliveredOf10: 8, shipping: 3500, maxCpa: 6000 };
}

export function validateNumbers(n: Partial<Numbers>): Numbers {
  const d = Number(n.deliveredOf10);
  if (!Number.isInteger(d) || d < 1 || d > 10) throw new OnboardingError("Escribe un número del 1 al 10.", 400, "deliveredOf10");
  const s = Number(n.shipping);
  if (!Number.isFinite(s) || s < 0) throw new OnboardingError("Escribe cuánto te cobra el envío por pedido.", 400, "shipping");
  const c = Number(n.maxCpa);
  if (!Number.isFinite(c) || c <= 0) throw new OnboardingError("Escribe cuánto puedes pagar como máximo por venta.", 400, "maxCpa");
  return { deliveredOf10: d, shipping: Math.round(s), maxCpa: Math.round(c) };
}

/** Guarda los números y arranca la generación (“Empezar a generar”). */
export function saveNumbers(state: OnboardingState, input: Partial<Numbers> | null, now: number): OnboardingState {
  if (!state.selected?.length) throw new OnboardingError("Primero elige con qué productos empezar.", 409);
  const numbers = input ? { ...validateNumbers(input), suggested: false } : { ...suggestedNumbers(), suggested: true };
  const generation = state.generation?.productIds.join() === state.selected.join() ? state.generation : { startedAt: now, productIds: state.selected };
  return { ...state, numbers, generation };
}

/** “A $24.990 ganarías $8.590 por venta entregada”. */
export function exampleProfit(productId: string | undefined, n: Numbers) {
  const p = (productId && findProduct(productId)) || CATALOG[0];
  return { product: p, profit: p.price - p.cost - n.shipping - n.maxCpa };
}

// ---------- Generación ----------

export function generationStatus(state: OnboardingState, now: number): GenerationStatus | undefined {
  const g = state.generation;
  if (!g) return undefined;
  const elapsed = now - g.startedAt;
  let cursor = 0;
  const items = g.productIds.map((id, i) => {
    const p = findProduct(id)!;
    const start = cursor;
    const duration = i === 0 ? FIRST_MS : NEXT_MS;
    cursor += duration;
    const end = cursor;
    if (elapsed >= end) {
      return FAILS[id]
        ? { id, name: p.name, image: p.image, status: "error" as const, detail: FAILS[id] }
        : { id, name: p.name, image: p.image, status: "generado" as const, detail: "8 textos · 6 imágenes" };
    }
    if (elapsed >= start) {
      const half = elapsed - start < duration / 2;
      return { id, name: p.name, image: p.image, status: "publicando" as const, detail: half ? "Escribiendo textos" : "Creando imágenes" };
    }
    const mins = Math.max(1, Math.ceil((start - elapsed) / 60_000));
    return { id, name: p.name, image: p.image, status: "cola" as const, detail: `Empieza en ~${mins} min` };
  });
  const done = items.filter((i) => i.status === "generado").length;
  const remaining = Math.max(0, cursor - elapsed);
  const first = items.find((i) => i.status === "generado");
  return {
    items,
    done,
    eta: remaining > 0 ? `unos ${Math.max(1, Math.ceil(remaining / 60_000))} min` : undefined,
    firstReady: first ? { id: first.id, name: first.name } : undefined,
  };
}

// ---------- Meta Ads ----------

export function startMeta(state: OnboardingState, nonce: string): { state: OnboardingState; authorizeUrl: string } {
  if (!state.shop || state.shop.status !== "connected") throw new OnboardingError("Primero conecta tu tienda Shopify.", 409);
  return {
    state: { ...state, meta: { status: "authorizing", nonce } },
    authorizeUrl: `/simulacion/meta?${new URLSearchParams({ state: nonce })}`,
  };
}

export function finishMeta(state: OnboardingState, q: { nonce: string; result: string }): OnboardingState {
  if (!state.meta || state.meta.nonce !== q.nonce) return { ...state, meta: { status: "error", error: "La autorización venció. Vuelve a conectar Meta Ads." } };
  if (q.result !== "ok") return { ...state, meta: { status: "error", error: "Cancelaste la autorización en Facebook. Puedes conectarla ahora o después." } };
  return { ...state, meta: { status: "action" } };
}

export function metaAssets(): MetaAssets {
  return {
    adAccounts: [
      { value: "a1", title: "Mi Tienda CL", meta: "CLP · activa", tag: "Sugerida" },
      { value: "a2", title: "Pruebas 2025", meta: "Deshabilitada por Meta", tone: "danger", disabled: true },
    ],
    pages: [{ value: "p1", title: "Mi Tienda", meta: "Instagram vinculado" }],
    pixels: [{ value: "x1", title: "Píxel Mi Tienda", meta: "Sin compras en 7 días: revisa que esté en tu tienda", tone: "warning" }],
    suggested: { account: "a1", page: "p1", pixel: "x1" },
  };
}

export function saveMetaAssets(state: OnboardingState, sel: { account?: string; page?: string; pixel?: string }, now: number): OnboardingState {
  if (state.meta?.status !== "action" && state.meta?.status !== "connected") throw new OnboardingError("Primero autoriza DropFlex en Facebook.", 409);
  const a = metaAssets();
  const pick = (list: MetaAssets["adAccounts"], v: string | undefined, what: string) => {
    const o = list.find((x) => x.value === v);
    if (!o || o.disabled) throw new OnboardingError(`Elige ${what}.`, 400, what);
    return o.title;
  };
  return {
    ...state,
    meta: {
      status: "connected",
      account: pick(a.adAccounts, sel.account, "una cuenta publicitaria"),
      page: pick(a.pages, sel.page, "una página"),
      pixel: pick(a.pixels, sel.pixel, "un píxel"),
    },
    finishedAt: state.finishedAt ?? now,
  };
}

/** “Conectar después”: no pierde nada; queda en SetupChecklist. */
export function skipMeta(state: OnboardingState, now: number): OnboardingState {
  if (!state.numbers) throw new OnboardingError("Primero define tus números.", 409);
  return { ...state, meta: { status: "later" }, finishedAt: state.finishedAt ?? now };
}

// ---------- Paso pendiente y resumen ----------

export function pendingStep(state: OnboardingState): StepKey {
  if (!state.shop || state.shop.status !== "connected") return "shopify";
  if (!state.selected?.length) return "productos";
  if (!state.numbers) return "numeros";
  if (!state.meta || state.meta.status === "authorizing" || state.meta.status === "error") return "meta";
  if (state.meta.status === "action") return "meta-cuentas";
  return "listo";
}

export { STEP_PATH } from "./paths";

const ORDER: StepKey[] = ["shopify", "productos", "numeros", "meta", "meta-cuentas", "listo"];

/** ¿Se puede entrar a este paso? A los ya hechos se vuelve; a los siguientes, no. */
export function canVisit(state: OnboardingState, step: StepKey): boolean {
  const pending = pendingStep(state);
  if (step === "meta-cuentas") return state.meta?.status === "action" || state.meta?.status === "connected";
  if (step === "listo") return pending === "listo";
  return ORDER.indexOf(step) <= ORDER.indexOf(pending === "meta-cuentas" ? "meta" : pending);
}

export function snapshot(state: OnboardingState, now: number): OnboardingSnapshot {
  return {
    step: pendingStep(state),
    account: state.account,
    shop: importStatus(state, now),
    selected: state.selected ?? [],
    numbers: state.numbers,
    generation: generationStatus(state, now),
    meta: state.meta ? { ...state.meta, nonce: undefined } : undefined,
    finished: Boolean(state.finishedAt),
    checklistHidden: Boolean(state.checklistHidden),
    planLimit: PLAN_LIMIT,
  };
}
