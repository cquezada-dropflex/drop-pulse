/**
 * Captura cada sección de /dev/componentes (claro y oscuro) en docs/capturas/componentes/,
 * con el mismo nombre que design-system/screenshots/componentes/ para compararlas lado a lado.
 *
 *   npm run dev   # en otra terminal
 *   npx tsx scripts/componentes.ts
 */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = join(process.cwd(), "docs/capturas/componentes");

// id de sección → nombre del componente en design-system/reference/
const NAMES: Record<string, string> = {
  button: "Button", "icon-button": "IconButton", icon: "Icon", "status-badge": "StatusBadge",
  "stage-meter": "StageMeter", "product-row": "ProductRow", "attention-item": "AttentionItem",
  "stage-list": "StageList", "review-card": "ReviewCard", "image-tile": "ImageTile",
  "segmented-control": "SegmentedControl", field: "Field", "price-breakdown": "PriceBreakdown",
  "offer-preview": "OfferPreview", metric: "Metric", "campaign-card": "CampaignCard",
  navigation: "Navigation", "top-bar": "TopBar", toast: "Toast", "assistant-sheet": "AssistantSheet",
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const scheme of ["light", "dark"] as const) {
    const page = await browser.newPage({ viewport: { width: 1024, height: 900 }, deviceScaleFactor: 2, colorScheme: scheme });
    await page.goto(`${BASE}/dev/componentes`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    for (const [id, name] of Object.entries(NAMES)) {
      const section = page.locator(`[data-componente="${id}"]`);
      await section.screenshot({ path: join(OUT, `${name}-${scheme === "light" ? "claro" : "oscuro"}.png`), animations: "disabled" });
    }
    await page.close();
  }
  await browser.close();
  console.log(`Capturas en ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
