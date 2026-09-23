// Cliente tipado de la API de onboarding (para componentes "use client").
import type { MetaAssets, Numbers, OnboardingSnapshot } from "./types";

export class ApiError extends Error {
  constructor(message: string, public field?: string, public status?: number) {
    super(message);
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/onboarding${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("No pudimos conectarnos. Revisa tu conexión e intenta de nuevo.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "No pudimos guardar el paso. Intenta de nuevo.", data.field, res.status);
  return data as T;
}

const post = <T>(path: string, data?: unknown) => call<T>(path, { method: "POST", body: data === undefined ? undefined : JSON.stringify(data) });

export const onboardingApi = {
  state: () => call<OnboardingSnapshot>("/state"),
  connectShopify: (shop: string) => post<{ authorizeUrl: string }>("/shopify/connect", { shop }),
  saveProducts: (ids: string[]) => post<{ snapshot: OnboardingSnapshot }>("/products", { ids }),
  saveNumbers: (n: Numbers | { sugeridos: true }) => post<{ snapshot: OnboardingSnapshot }>("/numbers", n),
  connectMeta: () => post<{ authorizeUrl: string }>("/meta/connect"),
  metaAssets: () => call<MetaAssets>("/meta/assets"),
  saveMetaAssets: (sel: { account: string; page: string; pixel: string }) => post<{ snapshot: OnboardingSnapshot }>("/meta/assets", sel),
  skipMeta: () => post<{ snapshot: OnboardingSnapshot }>("/meta/skip"),
  disconnectShopify: () => call<{ snapshot: OnboardingSnapshot }>("/shopify", { method: "DELETE" }),
  disconnectMeta: () => call<{ snapshot: OnboardingSnapshot }>("/meta", { method: "DELETE" }),
  setChecklistHidden: (hidden: boolean) => post<{ snapshot: OnboardingSnapshot }>("/checklist", { hidden }),
};
