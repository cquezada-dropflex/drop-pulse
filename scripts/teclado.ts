/**
 * Recorre cada ruta con Tab (escritorio, 1280px) y comprueba que cada elemento enfocado muestre
 * el anillo de foco (box-shadow con --ring o borde primary en campos). Imprime el orden de foco.
 * Luego prueba los atajos A / D / E de la revisión.
 *
 *   npx tsx scripts/teclado.ts
 */
import { chromium } from "@playwright/test";
import { ROUTES } from "./capturas";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let problems = 0;

  for (const r of ROUTES.filter((r) => !r.after)) {
    await page.goto(BASE + r.path, { waitUntil: "networkidle" });
    const order: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // Overlay de desarrollo de Next: no existe en producción.
        if (el.tagName === "NEXTJS-PORTAL") return { name: "__dev__", ring: true, visible: true };
        const cs = getComputedStyle(el);
        const box = el.closest("[data-focus]") ? (el.parentElement as HTMLElement) : el;
        const bcs = getComputedStyle(box);
        const ring = cs.boxShadow !== "none" || bcs.boxShadow !== "none" || bcs.borderColor !== "";
        const name = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
        const rect = el.getBoundingClientRect();
        return { name, ring: cs.boxShadow !== "none" || (el.dataset.focus === "within" && ring), visible: rect.width > 0 && rect.height > 0 };
      });
      if (!info) break;
      if (info.name === "__dev__") continue;
      if (order.length && order[0] === info.name && i > 3) break;
      order.push(info.name);
      if (!info.ring || !info.visible) {
        problems++;
        console.log(`  sin foco visible en ${r.path}: "${info.name}"`);
      }
    }
    console.log(`${r.path}\n  ${order.join(" → ")}`);
  }

  // Atajos de revisión en escritorio.
  await page.goto(`${BASE}/products/corrector-de-postura/copy`, { waitUntil: "networkidle" });
  const field = () => page.locator("section[aria-label^='Revisar'] h2").first().textContent();
  const before = await field();
  await page.keyboard.press("a");
  await page.waitForTimeout(400);
  const afterA = await field();
  await page.keyboard.press("d");
  await page.waitForTimeout(400);
  const afterD = await field();
  await page.keyboard.press("e");
  await page.waitForTimeout(200);
  const editing = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
  console.log(`\nAtajos: ${before} → A → ${afterA} → D → ${afterD} → E → foco en "${editing}"`);
  if (before === afterA || afterA === afterD || editing !== "Editar propuesta") problems++;

  await browser.close();
  console.log(problems ? `\n${problems} problemas` : "\nTeclado OK");
  process.exit(problems ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
