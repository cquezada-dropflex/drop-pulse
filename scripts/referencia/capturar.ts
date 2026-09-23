/**
 * Genera design-system/screenshots/ a partir de las previews de design-system/reference/
 * (decisión D1 del plan). Renderiza cada preview.html con React 18 + bundle.css + bundle.js,
 * en claro y en oscuro.
 *
 *   npx tsx scripts/referencia/capturar.ts
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DS = join(process.cwd(), "design-system");
const REF = join(DS, "reference");
const OUT = join(DS, "screenshots");

const exportCss = readFileSync(join(DS, "export/globals.css"), "utf8");
const tokens = JSON.parse(readFileSync(join(DS, "tokens.json"), "utf8"));
const bundleCss = readFileSync(join(REF, "bundle.css"), "utf8");
const bundleJs = readFileSync(join(REF, "bundle.js"), "utf8");

// Variables de color/medidas del export (bloques :root y .dark) + las que el export solo declara en @theme.
const varBlocks = exportCss.slice(exportCss.indexOf(":root {"), exportCss.indexOf("@theme inline"));
const typeClasses = tokens.type.groups
  .flatMap((g: { styles: Record<string, string | number>[] }) => g.styles)
  .map(
    (s: Record<string, string | number>) =>
      `.${s.name} { font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};` +
      (s.letterSpacing ? ` letter-spacing: ${s.letterSpacing};` : "") +
      (s.family === "mono" ? " font-family: var(--font-mono);" : "") +
      " }",
  )
  .join("\n");
const tokensCss = `
${varBlocks}
:root {
  --font-sans: ${tokens.type.families.sans};
  --font-mono: ${tokens.type.families.mono};
  --radius-sm: calc(var(--radius) - 4px); --radius-md: var(--radius); --radius-lg: calc(var(--radius) + 4px); --radius-full: 999px;
  --shadow-sm: var(--elevation-sm); --shadow-md: var(--elevation-md); --shadow-lg: var(--elevation-lg);
  --ease-standard: cubic-bezier(0.2, 0, 0, 1); --ease-enter: cubic-bezier(0, 0, 0, 1); --ease-exit: cubic-bezier(0.4, 0, 1, 1);
}
${typeClasses}
`;

function page(previewHtml: string, dark: boolean) {
  const script = previewHtml.slice(previewHtml.indexOf("<script>") + 8, previewHtml.lastIndexOf("</script>"));
  const style = previewHtml.includes("<style>")
    ? previewHtml.slice(previewHtml.indexOf("<style>") + 7, previewHtml.indexOf("</style>"))
    : "";
  const body = previewHtml.includes('<div class="cover">')
    ? previewHtml.slice(previewHtml.indexOf("<body>") + 6, previewHtml.indexOf("</body>"))
    : '<div id="root"></div>';
  return `<!doctype html><html lang="es" class="${dark ? "dark" : ""}" ${dark ? 'data-theme="dark"' : ""}><head><meta charset="utf-8">
<style>${tokensCss}</style><style>${bundleCss}</style><style>${style}</style>
<script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script>${bundleJs}</script></head><body>${body}${script.trim() ? `<script>${script}</script>` : ""}</body></html>`;
}

async function main() {
  const browser = await chromium.launch();
  const dirs = readdirSync(REF, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(join(REF, d.name, "preview.html")));
  for (const { name } of dirs) {
    const html = readFileSync(join(REF, name, "preview.html"), "utf8");
    const card = html.match(/@dsCard([^>]*)-->/)?.[1] ?? "";
    const width = Number(card.match(/width=(\d+)/)?.[1] ?? 720);
    const group = name.startsWith("Pantallas") ? "pantallas" : "componentes";
    mkdirSync(join(OUT, group), { recursive: true });
    for (const dark of [false, true]) {
      const p = await browser.newPage({ viewport: { width, height: 400 }, deviceScaleFactor: 2 });
      await p.setContent(page(html, dark), { waitUntil: "networkidle" });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(300);
      const file = join(OUT, group, `${name}-${dark ? "oscuro" : "claro"}.png`);
      await p.screenshot({ path: file, fullPage: true, animations: "disabled" });
      await p.close();
      console.log(file.replace(process.cwd() + "/", ""));
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
