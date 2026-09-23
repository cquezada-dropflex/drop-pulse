import "server-only";
import type { MetaAssets, MetaOption } from "@/lib/onboarding/types";
import { graphList } from "./client";

// Cuentas publicitarias, páginas y píxeles para O7 (spec §6.4). Se consulta todo con el token del
// usuario, paginado, y la selección se valida contra esta misma consulta al guardar (falla 18).

interface AdAccount {
  id: string;
  name: string;
  account_status: number;
  currency: string;
}
interface Page {
  id: string;
  name: string;
}
interface Pixel {
  id: string;
  name: string;
  last_fired_time?: string;
}

const MAX_ACCOUNTS_WITH_PIXELS = 25;
const PIXEL_STALE_MS = 7 * 86_400_000;

/** account_status de la Marketing API → motivo en texto (null = activa). */
function disabledReason(status: number): string | null {
  switch (status) {
    case 1:
      return null;
    case 3:
    case 8:
    case 9:
      return "Pago pendiente";
    case 7:
      return "En revisión";
    case 100:
    case 101:
      return "Cerrada";
    default:
      return "Deshabilitada por Meta";
  }
}

function pixelOption(p: Pixel, now: number): MetaOption {
  const last = p.last_fired_time ? Date.parse(p.last_fired_time) : NaN;
  if (Number.isNaN(last)) return { value: p.id, title: p.name, meta: "Sin eventos aún: revisa que esté en tu tienda", tone: "warning" };
  if (now - last > PIXEL_STALE_MS) return { value: p.id, title: p.name, meta: "Sin eventos en 7 días: revisa que esté en tu tienda", tone: "warning" };
  return { value: p.id, title: p.name, meta: "Recibiendo eventos" };
}

export interface RawAssets {
  accounts: AdAccount[];
  pages: Page[];
  pixelsByAccount: Record<string, Pixel[]>;
}

export async function fetchAccounts(token: string): Promise<AdAccount[]> {
  return graphList<AdAccount>(token, "/me/adaccounts", { fields: "id,name,account_status,currency" });
}

export async function fetchPages(token: string): Promise<Page[]> {
  return graphList<Page>(token, "/me/accounts", { fields: "id,name" });
}

export async function fetchPixels(token: string, accountId: string): Promise<Pixel[]> {
  return graphList<Pixel>(token, `/${accountId}/adspixels`, { fields: "id,name,last_fired_time" });
}

export async function fetchRawAssets(token: string): Promise<RawAssets> {
  const [accounts, pages] = await Promise.all([fetchAccounts(token), fetchPages(token)]);
  const active = accounts.filter((a) => a.account_status === 1).slice(0, MAX_ACCOUNTS_WITH_PIXELS);
  const pixelLists = await Promise.all(active.map((a) => fetchPixels(token, a.id).catch(() => [] as Pixel[])));
  return { accounts, pages, pixelsByAccount: Object.fromEntries(active.map((a, i) => [a.id, pixelLists[i]])) };
}

/** A O7: opciones con motivo en las deshabilitadas, avisos en los píxeles y la sugerencia marcada. */
export function toMetaAssets(raw: RawAssets, shopCurrency: string | null, now = Date.now()): MetaAssets {
  const active = raw.accounts.filter((a) => a.account_status === 1);
  const suggestedAccount = active.find((a) => a.currency === shopCurrency) ?? active[0];

  const adAccounts: MetaOption[] = [
    ...active.map((a) => ({ value: a.id, title: a.name, meta: `${a.currency} · activa`, tag: a.id === suggestedAccount?.id ? "Sugerida" : undefined })),
    ...raw.accounts
      .filter((a) => a.account_status !== 1)
      .map((a) => ({ value: a.id, title: a.name, meta: disabledReason(a.account_status) ?? undefined, tone: "danger" as const, disabled: true })),
  ];

  const pixelsByAccount: Record<string, MetaOption[]> = {};
  for (const [account, pixels] of Object.entries(raw.pixelsByAccount)) {
    // El que disparó más recientemente primero: es la sugerencia.
    const sorted = [...pixels].sort((a, b) => (Date.parse(b.last_fired_time ?? "") || 0) - (Date.parse(a.last_fired_time ?? "") || 0));
    pixelsByAccount[account] = sorted.map((p) => pixelOption(p, now));
  }

  const pages: MetaOption[] = raw.pages.map((p) => ({ value: p.id, title: p.name }));
  const account = suggestedAccount?.id ?? "";
  return {
    adAccounts,
    pages,
    pixels: pixelsByAccount[account] ?? [],
    pixelsByAccount,
    suggested: { account, page: pages[0]?.value ?? "", pixel: pixelsByAccount[account]?.[0]?.value ?? "" },
  };
}
