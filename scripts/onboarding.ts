/**
 * Recorre el onboarding completo contra la maqueta del backend y captura cada pantalla
 * (O1–O9 y los estados de error) a 390×844 y 1280×800, en claro y oscuro, en docs/capturas/onboarding/.
 * Falla si algún paso no llega a donde debe.
 *
 *   npm run dev   # en otra terminal (sin Supabase configurado: la maqueta crea la cuenta)
 *   npx tsx scripts/onboarding.ts
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(process.cwd(), "docs/capturas/onboarding");

const violations: string[] = [];

async function shot(page: Page, name: string, tag: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, `${name}-${tag}.png`), animations: "disabled" });
  // Accesibilidad de cada pantalla, en el estado en que se captura.
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  for (const v of r.violations) {
    violations.push(`${name} ${tag}: ${v.id} (${v.impact}) ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`);
  }
}

async function flow(page: Page, tag: string, desktop: boolean) {
  // O1 · Crear cuenta
  await page.goto(`${BASE}/auth/crear-cuenta`, { waitUntil: "networkidle" });
  await shot(page, "o1-crear-cuenta", tag);
  await page.getByLabel("Correo").fill("comerciante@ejemplo.cl");
  await page.getByRole("button", { name: "Crear cuenta gratis" }).click();
  await page.waitForURL("**/onboarding/shopify");

  // O2 · Paso 1, y la dirección mal escrita
  await page.getByLabel("Dirección de tu tienda").fill("mitienda");
  await shot(page, "o2-shopify", tag);
  await page.getByLabel("Dirección de tu tienda").fill("noexiste");
  await page.getByRole("button", { name: "Conectar con Shopify" }).click();
  await expect(page.getByText("No encontramos esa tienda. Revisa la dirección.")).toBeVisible();
  await shot(page, "o2-shopify-error-direccion", tag);

  // Autorización cancelada → ConnectionCard en error
  await page.getByLabel("Dirección de tu tienda").fill("mitienda");
  await page.getByRole("button", { name: "Conectar con Shopify" }).click();
  await page.waitForURL("**/simulacion/shopify**");
  await shot(page, "simulacion-shopify", tag);
  await page.getByRole("link", { name: "Cancelar" }).click();
  await page.waitForURL("**/onboarding/shopify");
  await expect(page.getByText("Cancelaste la autorización en Shopify", { exact: false })).toBeVisible();
  await shot(page, "o3-shopify-error", tag);

  // O3 · Autorizada, importando en segundo plano
  await page.getByRole("button", { name: "Reintentar" }).click();
  await page.waitForURL("**/simulacion/shopify**");
  await page.getByRole("link", { name: "Autorizar" }).click();
  await page.waitForURL("**/onboarding/shopify");
  await page.waitForTimeout(desktop ? 15_000 : 16_000); // ~86 de 128
  await shot(page, "o3-importando", tag);

  // O4 · Paso 2
  await page.getByRole("button", { name: "Elegir productos" }).first().click();
  await page.waitForURL("**/onboarding/productos");
  await expect(page.getByRole("button", { name: "Mejorar 3 productos" })).toBeVisible();
  await shot(page, "o4-productos", tag);

  // O5 · Paso 3
  await page.getByRole("button", { name: "Mejorar 3 productos" }).click();
  await page.waitForURL("**/onboarding/numeros");
  await expect(page.getByText("$8.590")).toBeVisible();
  await shot(page, "o5-numeros", tag);

  // O6 · Paso 4, con la generación avanzando
  await page.getByRole("button", { name: "Empezar a generar" }).click();
  await page.waitForURL("**/onboarding/meta");
  await page.waitForTimeout(9_000); // el primer producto termina a los 8 s
  await shot(page, "o6-meta", tag);

  // O7 · Cuentas de Meta
  await page.getByRole("button", { name: "Continuar con Facebook" }).click();
  await page.waitForURL("**/simulacion/meta**");
  await page.getByRole("link", { name: "Autorizar" }).click();
  await page.waitForURL("**/onboarding/meta/cuentas");
  await expect(page.getByText("Sugerida")).toBeVisible();
  await shot(page, "o7-meta-cuentas", tag);

  // O8 · Listo
  await page.getByRole("button", { name: "Guardar y terminar" }).click();
  await page.waitForURL("**/onboarding/listo");
  await expect(page.getByRole("link", { name: "Revisar Corrector de postura" })).toBeVisible();
  await shot(page, "o8-listo", tag);
}

async function skipMetaFlow(page: Page, tag: string) {
  // Camino corto: sugeridos y "Conectar después" → Hoy con SetupChecklist (O9).
  await page.request.delete(`${BASE}/api/onboarding/state`);
  await page.request.post(`${BASE}/api/onboarding/cuenta`, { data: { email: "comerciante@ejemplo.cl" } });
  const { authorizeUrl } = await (await page.request.post(`${BASE}/api/onboarding/shopify/conectar`, { data: { shop: "mitienda" } })).json();
  await page.goto(BASE + authorizeUrl);
  await page.getByRole("link", { name: "Autorizar" }).click();
  await page.waitForURL("**/onboarding/shopify");
  await page.goto(`${BASE}/onboarding/productos`);
  await page.getByRole("button", { name: "Mejorar 3 productos" }).click();
  await page.waitForURL("**/onboarding/numeros");
  await page.getByRole("button", { name: "Usar sugeridos" }).first().click();
  await page.waitForURL("**/onboarding/meta");
  await page.getByRole("button", { name: "Conectar después" }).click();
  await page.waitForURL("**/onboarding/listo");
  await page.getByRole("link", { name: "Ir a Hoy" }).click();
  await page.waitForURL("**/hoy");
  await expect(page.getByText("Termina de configurar")).toBeVisible();
  await shot(page, "o9-hoy", tag);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const only = process.argv[2];
  for (const vp of [
    { name: "390", width: 390, height: 844, mobile: true },
    { name: "1280", width: 1280, height: 800, mobile: false },
  ]) {
    for (const scheme of ["light", "dark"] as const) {
      const tag = `${vp.name}-${scheme === "light" ? "claro" : "oscuro"}`;
      if (only && !tag.includes(only)) continue;
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        colorScheme: scheme,
      });
      const page = await ctx.newPage();
      await flow(page, tag, !vp.mobile);
      await skipMetaFlow(page, tag);
      await ctx.close();
      console.log(`ok ${tag}`);
    }
  }
  await browser.close();
  if (violations.length) {
    console.log(violations.join("\n"));
    throw new Error(`${violations.length} violaciones de accesibilidad`);
  }
  console.log("Accesibilidad: sin violaciones");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
