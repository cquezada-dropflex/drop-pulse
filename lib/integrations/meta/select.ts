import "server-only";
import { OnboardingError, type MetaAssets } from "@/lib/onboarding/types";
import { fetchAccounts, fetchPages, fetchPixels, fetchRawAssets, toMetaAssets } from "./assets";
import { MetaAuthError, MetaPermissionError } from "./client";
import { getMetaConnection, markMetaError, metaToken, saveMetaSelection } from "./connection";

// O7: leer y guardar cuenta publicitaria, página y píxel, siempre con el token del comerciante.

async function tokenFor(userId: string): Promise<string> {
  const conn = await getMetaConnection(userId);
  if (!conn || (conn.status !== "action" && conn.status !== "connected")) {
    throw new OnboardingError("Primero autoriza DropFlex en Facebook.", 409);
  }
  const token = await metaToken(userId);
  if (!token) throw new OnboardingError("Primero autoriza DropFlex en Facebook.", 409);
  return token;
}

async function guard<T>(userId: string, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    if (e instanceof MetaAuthError) {
      await markMetaError(userId, "expired");
      throw new OnboardingError("La autorización venció. Vuelve a conectar Meta Ads.", 409);
    }
    if (e instanceof MetaPermissionError) {
      await markMetaError(userId, "insufficient_scope");
      throw new OnboardingError("Faltan permisos para ver tus cuentas publicitarias. Vuelve a conectar y acepta todos.", 409);
    }
    throw e;
  }
}

export class NoAdAccountsError extends OnboardingError {}

export async function loadMetaAssets(userId: string, shopCurrency: string | null): Promise<MetaAssets> {
  const token = await tokenFor(userId);
  const assets = await guard(userId, async () => toMetaAssets(await fetchRawAssets(token), shopCurrency));
  if (!assets.adAccounts.some((a) => !a.disabled)) {
    await markMetaError(userId, "no_ad_accounts");
    throw new NoAdAccountsError("No encontramos cuentas publicitarias activas en tu Business Manager. Activa una en Meta o conecta después.", 409);
  }
  return assets;
}

/** Valida la selección contra Meta (no contra lo que mande el cliente) y la guarda con sus nombres. */
export async function saveMetaAssets(userId: string, sel: { account?: string; page?: string; pixel?: string }) {
  const token = await tokenFor(userId);
  await guard(userId, async () => {
    const [accounts, pages] = await Promise.all([fetchAccounts(token), fetchPages(token)]);
    const account = accounts.find((a) => a.id === sel.account && a.account_status === 1);
    if (!account) throw new OnboardingError("Elige una cuenta publicitaria.", 400, "account");
    const page = pages.find((p) => p.id === sel.page);
    if (!page) throw new OnboardingError("Elige una página.", 400, "page");
    const pixels = await fetchPixels(token, account.id);
    const pixel = pixels.find((p) => p.id === sel.pixel);
    if (!pixel) throw new OnboardingError("Elige un píxel.", 400, "pixel");
    await saveMetaSelection(userId, {
      accountId: account.id,
      accountName: account.name,
      currency: account.currency,
      pageId: page.id,
      pageName: page.name,
      pixelId: pixel.id,
      pixelName: pixel.name,
    });
  });
}
