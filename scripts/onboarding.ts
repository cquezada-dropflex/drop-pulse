/**
 * Recorre el onboarding contra el backend REAL (Supabase + Shopify) y captura cada pantalla a 390×844 y
 * 1280×800, en claro y oscuro, en docs/capturas/onboarding/, con axe en cada una.
 *
 * El salto a Shopify y a Facebook no se automatiza: usa un usuario de prueba que YA conectó una tienda
 * de desarrollo (con productos) desde la app de desarrollo (shopify.app.dev.toml). El script cambia su
 * selección, sus números y deja Meta como “Conectar después”.
 *
 *   TEST_EMAIL=… TEST_PASSWORD=… npm run check:onboarding   # con npm run dev en otra terminal
 */
import AxeBuilder from "@axe-core/playwright";
import { chromium, expect, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(process.cwd(), "docs/capturas/onboarding");
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

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

async function flow(page: Page, tag: string) {
  // O1 · Crear cuenta (sin sesión)
  await page.goto(`${BASE}/auth/create-account`, { waitUntil: "networkidle" });
  await shot(page, "o1-crear-cuenta", tag);

  // Sesión del usuario de prueba; vuelve al onboarding con ?next=
  await page.goto(`${BASE}/auth/login?next=/onboarding/shopify`);
  await page.getByLabel("Correo").fill(EMAIL!);
  await page.getByLabel("Contraseña").fill(PASSWORD!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.waitForURL("**/onboarding/shopify");

  // O3 · Tienda conectada (importando o lista)
  await expect(page.getByRole("button", { name: "Elegir productos" }).first()).toBeVisible();
  await shot(page, "o3-shopify", tag);

  // O4 · Paso 2 con productos reales
  await page.getByRole("button", { name: "Elegir productos" }).first().click();
  await page.waitForURL("**/onboarding/products");
  const improve = page.getByRole("button", { name: /^Mejorar \d+ productos?$/ });
  await expect(improve).toBeVisible();
  await shot(page, "o4-productos", tag);

  // O5 · Paso 3
  await improve.click();
  await page.waitForURL("**/onboarding/numbers");
  await expect(page.getByText("Ejemplo con tu", { exact: false })).toBeVisible();
  await shot(page, "o5-numeros", tag);

  // O6 · Paso 4, con la generación avanzando
  await page.getByRole("button", { name: "Empezar a generar" }).click();
  await page.waitForURL("**/onboarding/meta");
  await page.waitForTimeout(9_000); // la generación simulada termina el primero a los 8 s
  await shot(page, "o6-meta", tag);

  // O8 · Listo, con Meta pendiente
  await page.getByRole("button", { name: "Conectar después" }).click();
  await page.waitForURL("**/onboarding/done");
  await expect(page.getByRole("link", { name: /^Revisar / })).toBeVisible();
  await shot(page, "o8-listo", tag);

  // O9 · Hoy con SetupChecklist y Ajustes › Conexiones
  await page.getByRole("link", { name: "Ir a Hoy" }).click();
  await page.waitForURL("**/today");
  await shot(page, "o9-hoy", tag);
  await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Conexiones" })).toBeVisible();
  await shot(page, "ajustes-conexiones", tag);
}

async function main() {
  if (!EMAIL || !PASSWORD) throw new Error("Define TEST_EMAIL y TEST_PASSWORD de un usuario con una tienda de desarrollo ya conectada.");
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
      await flow(page, tag);
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
