// Contratos del backend de onboarding (design-system/onboarding.md). Hoy los implementa una maqueta
// (lib/onboarding/service.ts); en producción, la API real con Shopify OAuth y Facebook Login for Business.

export type StepKey = "shopify" | "productos" | "numeros" | "meta" | "meta-cuentas" | "listo";

/** Estado persistido (cookie httpOnly en la maqueta; tabla `onboarding` en producción). */
export interface OnboardingState {
  version: 1;
  account?: { email: string; createdAt: number };
  shop?: {
    domain: string;
    status: "connecting" | "connected" | "error";
    error?: string;
    connectedAt?: number;
    /** Nonce del flujo OAuth (parámetro `state`). */
    nonce?: string;
  };
  /** Ids de productos elegidos, en orden. */
  selected?: string[];
  numbers?: Numbers & { suggested: boolean };
  generation?: { startedAt: number; productIds: string[] };
  meta?: {
    status: "authorizing" | "action" | "connected" | "later" | "error";
    error?: string;
    nonce?: string;
    account?: string;
    page?: string;
    pixel?: string;
  };
  finishedAt?: number;
  checklistHidden?: boolean;
}

export interface Numbers {
  /** De cada 10 pedidos, cuántos se entregan. */
  deliveredOf10: number;
  /** Envío por pedido, CLP. */
  shipping: number;
  /** Máximo por venta en anuncios (CPA límite), CLP. */
  maxCpa: number;
}

export interface CatalogProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  cost: number;
  /** Ventas en los últimos 30 días. */
  sales30: number;
  issues: string[];
  score: "Alta" | "Media" | "Baja";
}

export interface ImportStatus {
  status: "connecting" | "importing" | "connected" | "error";
  domain?: string;
  imported: number;
  total: number;
  currency: string;
  error?: string;
}

export interface GenerationRow {
  id: string;
  name: string;
  image: string;
  status: "generado" | "publicando" | "cola" | "error";
  detail: string;
}

export interface GenerationStatus {
  items: GenerationRow[];
  done: number;
  /** “unos 3 min”; vacío cuando terminó. */
  eta?: string;
  firstReady?: { id: string; name: string };
}

/** Lo que devuelve GET /api/onboarding/state: el estado con lo derivado ya calculado. */
export interface OnboardingSnapshot {
  step: StepKey;
  account?: OnboardingState["account"];
  shop?: ImportStatus;
  selected: string[];
  numbers?: OnboardingState["numbers"];
  generation?: GenerationStatus;
  meta?: OnboardingState["meta"];
  finished: boolean;
  checklistHidden: boolean;
  planLimit: number;
}

export interface MetaAssets {
  adAccounts: { value: string; title: string; meta?: string; tone?: "warning" | "danger"; disabled?: boolean; tag?: string }[];
  pages: MetaAssets["adAccounts"];
  pixels: MetaAssets["adAccounts"];
  suggested: { account: string; page: string; pixel: string };
}

export class OnboardingError extends Error {
  constructor(
    message: string,
    public status = 400,
    public field?: string,
  ) {
    super(message);
  }
}
