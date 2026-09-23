/**
 * Une cada captura de referencia con la nuestra, lado a lado, en docs/capturas/comparacion/.
 *
 *   npx tsx scripts/comparar.ts componentes      # design-system/screenshots/componentes vs docs/capturas/componentes
 */
import { chromium } from "@playwright/test";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const kind = process.argv[2] ?? "componentes";
const REF = join(process.cwd(), "design-system/screenshots", kind);
const OURS = join(process.cwd(), "docs/capturas", kind);
const OUT = join(process.cwd(), "docs/capturas/comparacion", kind);

const dataUri = (p: string) => `data:image/png;base64,${readFileSync(p).toString("base64")}`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 400 } });
  for (const file of readdirSync(REF).filter((f) => f.endsWith(".png"))) {
    const ours = join(OURS, file);
    if (!existsSync(ours)) {
      console.log(`sin captura propia: ${file}`);
      continue;
    }
    await page.setContent(`<body style="margin:0;font:13px system-ui;background:#888">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px;align-items:start">
        <div><p style="margin:0 0 4px;color:#fff">Referencia · ${file}</p><img style="width:100%" src="${dataUri(join(REF, file))}"></div>
        <div><p style="margin:0 0 4px;color:#fff">Implementación</p><img style="width:100%" src="${dataUri(ours)}"></div>
      </div></body>`);
    await page.screenshot({ path: join(OUT, file), fullPage: true });
  }
  await browser.close();
  console.log(`Comparaciones en ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
