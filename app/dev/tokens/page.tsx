import type { Metadata } from "next";
import { colorToken, colorTokens, typeGroups, type ThemeId } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tokens" };

// Clase de Tailwind para cada estilo de tokens.json → type (literal para que Tailwind la detecte).
const TYPE_CLASS: Record<string, string> = {
  "type-display": "text-display",
  "type-title": "text-title",
  "type-heading": "text-heading",
  "type-body": "text-body",
  "type-body-strong": "text-body font-medium",
  "type-label": "text-label",
  "type-caption": "text-caption",
  "type-metric-lg": "text-metric-lg",
  "type-metric": "text-metric",
  "type-code": "text-code font-mono",
};

// Derivados de reference/bundle.css (decisión D3): se muestran aparte.
const DERIVED = [
  { name: "text-topbar", size: "17/22 · 600", className: "text-topbar", sample: "Corrector de postura" },
  { name: "text-row", size: "15/20 · 500", className: "text-row", sample: "Lámpara lunar 3D" },
  { name: "text-small", size: "14/20", className: "text-small", sample: "Descripción aceptada" },
  { name: "text-micro", size: "11/16", className: "text-micro font-medium", sample: "Portada" },
  { name: "text-tab", size: "11/14 · 500", className: "text-tab", sample: "Productos" },
];

const RADII = [
  { name: "radius-sm", className: "rounded-sm", value: "6px" },
  { name: "radius-md", className: "rounded-md", value: "10px" },
  { name: "radius-lg", className: "rounded-lg", value: "14px" },
  { name: "radius-full", className: "rounded-full", value: "999px" },
];

const SHADOWS = [
  { name: "shadow-sm", className: "shadow-sm" },
  { name: "shadow-md", className: "shadow-md" },
  { name: "shadow-lg", className: "shadow-lg" },
];

function ColorPanel({ theme }: { theme: ThemeId }) {
  return (
    <section
      aria-labelledby={`colores-${theme}`}
      className={cn(theme, "rounded-lg border bg-background p-4 text-foreground")}
    >
      <h2 id={`colores-${theme}`} className="text-heading">
        {theme === "light" ? "Claro" : "Oscuro"}
      </h2>
      <ul className="mt-3 grid gap-2">
        {colorTokens.map((token) => (
          <li key={token.name} className="flex items-center gap-3">
            <span
              className="size-12 shrink-0 rounded-sm border"
              style={{ background: `var(--${token.name})` }}
              aria-hidden
            />
            <span className="min-w-0">
              <span className="block text-label">{token.name}</span>
              <span className="block font-mono text-code text-muted-foreground">
                {colorToken(token.name, theme)}
                {/^\{/.test(token.value[theme]) ? ` · ${token.value[theme]}` : ""}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function TokensPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 lg:px-6">
      <header>
        <h1 className="text-display">Tokens</h1>
        <p className="text-body text-muted-foreground">
          Todos los colores de design-system/tokens.json, en claro y oscuro, y la escala tipográfica.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ColorPanel theme="light" />
        <ColorPanel theme="dark" />
      </div>

      <section aria-labelledby="tipografia" className="flex flex-col gap-4">
        <h2 id="tipografia" className="text-title">Tipografía</h2>
        {typeGroups.map((group) => (
          <div key={group.name} className="rounded-lg border">
            <h3 className="border-b px-4 py-3 text-heading">{group.name}</h3>
            <ul>
              {group.styles.map((style) => (
                <li
                  key={style.name}
                  className="grid gap-1 border-b px-4 py-3 last:border-b-0 md:grid-cols-3 md:items-baseline md:gap-4"
                >
                  <span className="font-mono text-code text-muted-foreground">
                    {style.name} · {style.fontSize}/{style.lineHeight} · {style.fontWeight}
                  </span>
                  <span className={cn("md:col-span-2", TYPE_CLASS[style.name])}>{style.sample}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="rounded-lg border">
          <h3 className="border-b px-4 py-3 text-heading">Derivados de bundle.css</h3>
          <ul>
            {DERIVED.map((style) => (
              <li
                key={style.name}
                className="grid gap-1 border-b px-4 py-3 last:border-b-0 md:grid-cols-3 md:items-baseline md:gap-4"
              >
                <span className="font-mono text-code text-muted-foreground">
                  {style.name} · {style.size}
                </span>
                <span className={cn("md:col-span-2", style.className)}>{style.sample}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="forma" className="flex flex-col gap-4">
        <h2 id="forma" className="text-title">Forma y elevación</h2>
        <ul className="flex flex-wrap gap-4">
          {RADII.map((r) => (
            <li key={r.name} className="flex flex-col items-center gap-2">
              <span className={cn("size-16 border-2 border-input bg-muted", r.className)} aria-hidden />
              <span className="font-mono text-code text-muted-foreground">
                {r.name} · {r.value}
              </span>
            </li>
          ))}
          {SHADOWS.map((s) => (
            <li key={s.name} className="flex flex-col items-center gap-2">
              <span className={cn("size-16 rounded-md bg-card", s.className)} aria-hidden />
              <span className="font-mono text-code text-muted-foreground">{s.name}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
