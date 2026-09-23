# Plan: design system DropFlex en dropflex-v2

Estado: **aprobado** (2026-09-23).

Decisiones tomadas:
- **D1:** se copia el artifact a `./design-system/` con `components/` → `reference/`; las capturas de referencia se generan con Playwright.
- **D2:** migración a Tailwind v4.
- **D3:** opción (a), tokens derivados de `bundle.css` en un bloque aparte de `globals.css`.
- **D4:** `Button` sigue al design system: variante por defecto **`secondary`** (como `bundle.js`); `primary` se declara explícitamente.

## 0. Punto de partida

### Proyecto

| Cosa | Valor |
|---|---|
| Next.js | 16.3.6 (App Router, Turbopack, `cacheComponents: true`, `proxy.ts` en lugar de `middleware.ts`) |
| React | 19 |
| Tailwind | **3.4.19** + `tailwindcss-animate`, `tailwind.config.ts` con colores `hsl(var(--x))` |
| shadcn | `components.json` new-york, `components/ui/`: badge, button, card, checkbox, dropdown-menu, input, label |
| next-themes | 0.4.6, ya montado en `app/layout.tsx` (`attribute="class"`, `defaultTheme="system"`) |
| lucide-react | 0.511.0 |
| Fuente | `Geist` por `next/font/google` como `--font-geist-sans` (sin Geist Mono) |
| Supabase | `proxy.ts` → `lib/supabase/proxy.ts` redirige a `/auth/login` toda ruta ≠ `/` y ≠ `/auth*` sin sesión, **solo si hay variables de entorno** (no hay `.env.local` en el repo) |
| Línea base | `npm run build` ✅ · `tsc --noEmit` ✅ · `npm run lint` ❌ 65 errores (ESLint recorre `.next/` porque no hay `ignores`; más `require()` en `tailwind.config.ts`) |

### Design system

`./design-system/` **no existe** en el repo. El artifact tiene el contenido bajo `project/`, pero con otra estructura que la que describe el encargo:

| Encargo | Artifact | Nota |
|---|---|---|
| `LEEME.md` | — | No existe. `README.md` cumple ese papel |
| `README.md`, `arquitectura.md`, `tailwind-shadcn.md`, `tokens.json` | igual | ✅ |
| `export/globals.css`, `export/components.json` | igual | ✅ (Tailwind v4) |
| `reference/index.d.ts`, `reference/<X>/README.md`, `reference/bundle.css`, `reference/bundle.js` | `components/…` | Mismo contenido, otra carpeta |
| `reference/Pantallas*/preview.html` | `components/Pantallas*/preview.html` | Solo montan `DropFlex.Screens.*` de `bundle.js`; los textos y cifras están en `bundle.js` |
| `screenshots/`, `screenshots/componentes/` | — | **No existen.** Ver decisión D1 |

Lo leí completo: README, arquitectura, tailwind-shadcn, tokens.json, export/*, index.d.ts, los 19 README de componentes, bundle.css, bundle.js y las previews.

## 1. Decisiones que necesito de ti

**D1. Carpeta `design-system/` y capturas de referencia.** Propongo copiar `project/` del artifact a `./design-system/`, renombrando `components/` → `reference/` para que coincida con el encargo y con `CLAUDE.md`, y generar `design-system/screenshots/` yo mismo: una página HTML estática que carga React 18 (jsDelivr) + `bundle.css` + un `tokens.css` derivado de `tokens.json` + `bundle.js`, y Playwright captura cada `preview.html` en claro y oscuro. Esas capturas son la referencia visual de las Fases 2 y 5. Alternativa: me pasas tú la carpeta con las capturas.

**D2. Tailwind v3 o v4.** Recomiendo **migrar a v4**, porque en este repo es casi trivial:
- `export/globals.css` ya está escrito para v4: se pega tal cual, sin traducir (y desaparece el riesgo de `hsl()` alrededor de un hex).
- La escala tipográfica con line-height y peso (`--text-title--line-height`…) es nativa de v4; en v3 va a mano en `fontSize`.
- Casi todo lo que usa Tailwind hoy (tutorial, hero, formularios de auth, `components/ui/*`) se borra o se reescribe en este mismo trabajo.
- Pasos: `tailwindcss@4` + `@tailwindcss/postcss`, `postcss.config.mjs` con `@tailwindcss/postcss`, `tailwindcss-animate` → `tw-animate-css`, borrar `tailwind.config.ts` (y con eso el error de `require()`), regenerar `components/ui/*` con `npx shadcn@latest add … --overwrite` para v4.
- Riesgo: v4 pide Safari ≥ 16.4 / Chrome ≥ 111. En iPhone equivale a iOS 16.4 (2023); Chrome en Android se actualiza solo. Si tus comerciantes usan teléfonos muy viejos, quedémonos en v3.
- Si prefieres v3: traduzco el mismo contenido a `@layer base` + `tailwind.config.ts` como pediste (colores `'var(--x)'` sin `hsl()`, `fontSize` con `[size, {lineHeight, fontWeight, letterSpacing}]`, etc.).

**D3. Medidas de `bundle.css` que no están en `tokens.json`.** La referencia usa valores fuera de la escala:
- **Tamaños de texto:** 11px (chip `sm`, “Opcional”, etiquetas ORIGINAL/PROPUESTA, `kbd`, “Portada”/“Recuperar”, conteo del segmentado, etiquetas de pestaña, badge de conteo), 14px (texto original, botones de revisión, leyenda del desglose, mensajes del asistente, toast, ítems del riel, CTA de la oferta) y 17px (título de `TopBar`). Ojo: 11px contradice “`type-caption` 12px, mínimo absoluto”.
- **Line-height 20px con texto de 15px** (nombre de fila, título de ítem y de etapa, botón) frente a `type-body` 15/22.
- **Medidas fuera de la grilla de 2px:** gap de 3px (medidor), padding de 3px y radio de 7px (segmentado), radio de 3px (muestra de leyenda) y de 4px (`kbd`), bordes de 1,5px (punto de etapa, propuesta), badge en `left: 34px`, marca del riel de 22px.

Opciones:
- **(a) Recomendada:** agregar a `globals.css` un bloque separado, “Derivados de reference/bundle.css”, con tokens nombrados (`--text-micro` 11/16, `--text-small` 14/20, `--text-topbar` 17/22, `--text-row` 15/20 peso 500, y las medidas sueltas). Las clases quedan basadas en tokens, la fidelidad con la referencia es exacta y un grep encuentra cada excepción.
- **(b)** Ajustar a la escala: 11 → `caption` 12, 14 → `label` 13 o `body` 15 según el caso, 17 → `heading` 16, 3px → 4px, etc. Cumple la regla al pie de la letra, pero se aleja de la referencia.

Las medidas que son múltiplo de 2px (6, 28, 36, 56px…) salen de la escala de spacing de Tailwind (`--spacing: 4px`: `1.5` = 6px, `7` = 28px, `9` = 36px, `14` = 56px): no son valores arbitrarios.

**D4. Variante por defecto de `Button`.** El encargo dice `primary` por defecto; `bundle.js` usa `secondary` por defecto. Voy a seguir el encargo (`primary`) salvo que me digas lo contrario. Implica que cada botón no principal declara su variante, lo que ayuda a respetar “un solo primary por vista”.

## 2. Otras contradicciones de la fuente y cómo las resuelvo (sin preguntar)

| Tema | Fuente A | Fuente B | Resolución |
|---|---|---|---|
| Foco | `export/globals.css`: `outline 2px` + offset 2px | `bundle.css`: `box-shadow 0 0 0 2px background, 0 0 0 4px ring` | `bundle.css`, como pediste. `outline` transparente además, para modo de alto contraste de Windows |
| Movimiento reducido | `export/globals.css` lleva **todo** a 0ms | `tokens.json`: “salvo el indicador de publicación” | Todo a 0ms salvo el arco de `publicando` (con una clase `motion-exempt`). El brillo de imágenes generándose sí se detiene (como en `bundle.css`) |
| Área táctil de `Button md` | alto 40px (`size-control`) | README: “mínima 44px en `md` y `lg`” | Dibujo de 40px + área invisible de 44px con un pseudo-elemento (`before:absolute before:-inset-y-0.5`). Lo mismo en `sm` (32px), chips del asistente y pestañas del segmentado |
| Colores fijos en `ImageTile` | `bundle.css`: `rgba(255,255,255,.85)` y `#5a606b` en el círculo sin elegir | Regla “sin hex sueltos” | Mapeo a tokens: `bg-background/85` + anillo `muted-foreground` (en claro, `#5a606b` **es** `muted-foreground`) |
| Toast | `sonner` apila y dura 4 s por defecto | 5 s, no apila, sobre la barra fija | `<Toaster visibleToasts={1} duration={5000}>` con un `id` fijo por toast (reemplaza al anterior), `offset` = alto de la barra fija + área segura, estilo `df-toast` (`bg-foreground text-background`) |
| Dinero | `bundle.js` `money()` con regex | Encargo: `Intl.NumberFormat('es-CL')` | `Intl` con `currency: 'CLP'` → `$24.990`; negativos con signo menos tipográfico U+2212 → `−$1.200` |
| Imágenes de producto | `bundle.js` `productImage()` genera SVG con hex | Regla “sin hex” en `components/` y `app/` | Se mueve a `lib/mock/images.ts` (datos de ejemplo, fuera de la regla); los componentes reciben `src` |
| Íconos | `bundle.js`: trazados propios | Encargo: `lucide-react` con `strokeWidth={1.75}` y el mapeo dado | lucide. Para los nombres de `IconName` que tu tabla no mapea uso: chevron-right→`ChevronRight`, chevron-left→`ChevronLeft`, plus→`Plus`, chat→`MessageSquare`, image→`Image`, tag→`Tag`, text→`AlignLeft`, store→`Store`, arrow-up→`ArrowUp`, arrow-down→`ArrowDown`, pause→`Pause`, more→`Ellipsis`, search→`Search`, minus→`Minus`, grip→`GripVertical`, star→`Star`. Respeto los `strokeWidth` 2 / 2,25 que `bundle.js` sube en chips, puntos de etapa y veredictos |
| `/` sin sesión | Encargo: “`/` redirige a `/today` si hay sesión” | El proxy excluye `/` de su redirección | `/` redirige a `/today` con sesión y a `/auth/login` sin ella (ya no hay landing de marketing). Lo hago en `app/page.tsx`, sin tocar el proxy |

## 3. Tailwind: cómo quedan los tokens

- **Con v4 (D2 recomendado):** `app/globals.css` = `@import "tailwindcss"` + `@import "tw-animate-css"` + el contenido de `export/globals.css`, sin su `@import url(fonts.googleapis…)`. En `@theme inline`, `--font-sans: var(--font-geist-sans), …` y `--font-mono: var(--font-geist-mono), …` para que tomen `next/font`. Sumo `--text-*--letter-spacing` para `display`, `title` y `metric-lg` (están en tokens.json pero no en el export), la utilidad `text-code`, y `--z-*`, `--duration-*` y `--size-*` como utilidades. Si eliges D3(a), también el bloque de derivados.
- **Con v3:** `:root`/`.dark` dentro de `@layer base`; `tailwind.config.ts` con `colors: { background: 'var(--background)', … }` (hex, sin `hsl()`), `borderRadius` (sm/md/lg/xl/full), `fontFamily`, `fontSize` (`display…metric-lg` + `code`), `boxShadow` (sm/md/lg → `var(--elevation-*)`), `transitionTimingFunction` (standard/enter/exit), `transitionDuration` (fast/base/slow), `spacing` para `touch`, `control`, `topbar`, `tabbar`, `rail`, `content`, `zIndex`, `screens` (md 768 / lg 1024).

Opacidades como `bg-background/85` funcionan en v4 (`color-mix`). En v3 no funcionan con `var()` de hex, así que ahí `ImageTile` usaría `bg-background` sólido.

## 4. Archivos

### Crear

```
design-system/                        ← copia del artifact (D1), components/ → reference/, + screenshots/
CLAUDE.md                             ← al terminar la Fase 1
docs/plan-design-system.md            ← este archivo
docs/esquema-supabase.md              ← Fase 4
docs/capturas/                        ← Fase 5
scripts/capturas.ts                   ← Playwright: capturas 390×844 y 1280×800, claro y oscuro
scripts/a11y.ts                       ← @axe-core/playwright en cada ruta y tema
scripts/valores-sueltos.sh            ← grep de hex / rgb() / px arbitrarios en components/ y app/
scripts/referencia/                   ← harness para generar design-system/screenshots/ (D1)

app/dev/layout.tsx                    ← notFound() fuera de desarrollo
app/dev/tokens/page.tsx               ← todos los colores de tokens.json (claro y oscuro lado a lado) + escala tipográfica
app/dev/components/page.tsx          ← cada componente en todos sus estados

app/(app)/layout.tsx                  ← shell: TopBar/Navigation/riel + AssistantProvider + Toaster
app/(app)/today/{page,loading,error}.tsx
app/(app)/products/{page,loading,error}.tsx
app/(app)/products/[id]/{page,loading,error,not-found}.tsx
app/(app)/products/[id]/layout.tsx   ← en escritorio, StageList fija a la izquierda
app/(app)/products/[id]/copy/{page,loading,error}.tsx
app/(app)/products/[id]/images/{page,loading,error}.tsx
app/(app)/products/[id]/price/{page,loading,error}.tsx
app/(app)/campaigns/{page,loading,error}.tsx
app/(app)/campaigns/[id]/{page,loading,error,not-found}.tsx
app/(app)/settings/{page,loading,error}.tsx   ← supuestos (tasa de entrega, CPA máximo), tema, cerrar sesión

components/df/                        ← un archivo por componente (inventario abajo)
components/df/index.ts                ← barrel
components/shell/app-shell.tsx, assistant-provider.tsx, sticky-actions.tsx, page-header.tsx, skeletons.tsx, empty-state.tsx
components/screens/                   ← piezas cliente por pantalla: review-flow.tsx, image-picker.tsx, price-editor.tsx, product-filter.tsx, campaign-actions.tsx

lib/types.ts                          ← Product, Stage, ContentItem (status: ContentStatus), ImageOption, Pricing, Campaign (verdict), AttentionItemData
lib/format.ts                         ← money(), percent(), multiplier() con Intl es-CL
lib/mock/{products,content,images,pricing,campaigns,today}.ts
lib/data/{today,products,campaigns,settings}.ts   ← getTodayQueue(), getProducts(filter), getProduct(id), getContent(id, stage), getImages(id), getPricing(id), getCampaigns(period), getCampaign(id), getAssumptions()
```

### Modificar

```
app/globals.css            ← tokens (§3)
app/layout.tsx             ← lang="es", Geist + Geist Mono, viewport (viewportFit cover, themeColor claro/oscuro), metadata en español, ThemeProvider (se mantiene), sin disableTransitionOnChange si interfiere con los tokens
app/page.tsx               ← solo redirección (§2)
app/auth/*/page.tsx        ← layout de auth restilizado
components/login-form.tsx, sign-up-form.tsx, forgot-password-form.tsx, update-password-form.tsx, logout-button.tsx
                           ← con Field/Button de df, en español con tuteo; login redirige a /today en lugar de /protected
                              (solo cambia la UI y el destino; la llamada a supabase.auth queda igual)
components/theme-switcher.tsx ← restilizado con IconButton + dropdown, textos “Claro / Oscuro / Sistema”
components.json            ← con v4: "config": "" ya está; sin cambios salvo lo que pida la CLI
eslint.config.mjs          ← ignores: .next/, node_modules/, design-system/, docs/capturas/ (arregla la línea base del lint)
package.json               ← dependencias (§6)
postcss.config.mjs         ← solo con v4
```

### Borrar

```
components/tutorial/*          (code-block, connect-supabase-steps, fetch-data-steps, sign-up-user-steps, tutorial-step)
components/hero.tsx, deploy-button.tsx, next-logo.tsx, supabase-logo.tsx, env-var-warning.tsx, auth-button.tsx
app/protected/*                (lo reemplaza app/(app)/)
app/opengraph-image.png, app/twitter-image.png   (imágenes del starter de Supabase; se agregan las de DropFlex cuando haya marca)
tailwind.config.ts             (solo con v4)
components/ui/badge.tsx, card.tsx, checkbox.tsx   (si nada los usa tras reescribir auth; StatusBadge reemplaza a badge)
```

### No se tocan

`proxy.ts`, `lib/supabase/*` (client, server, proxy), `app/auth/confirm/route.ts`, y la lógica de auth de los formularios (las llamadas a `supabase.auth.*`).

## 5. Inventario de componentes (`components/df/`)

| Componente | Base | Cliente | Notas de implementación |
|---|---|---|---|
| `Icon` | `lucide-react` | no | `name: IconName` → componente lucide (§2), `strokeWidth` 1,75 por defecto, 20px / `sm` 16px, `aria-hidden` salvo que tenga `label` (entonces `role="img"`) |
| `Button` | shadcn `button` (cva) | no | variantes `primary`, `secondary` (defecto, D4) (card + borde `input`), `ghost`, `destructive`; tamaños `sm` 32 / `md` 40 / `lg` 48; `icon`, `iconEnd`, `loading` (spinner + `aria-busy`, deshabilitado), `block`, `kbd`, `asChild` (para `Link`). Presionado `scale-[.98]` → token de escala o `active:scale-98`; deshabilitado `bg-muted text-muted-foreground` (nunca solo opacidad) |
| `IconButton` | shadcn `button` size `icon` | no | 44×44, `label` obligatorio en el tipo → `aria-label` + `title`; `variant="primary"` círculo |
| `StatusBadge` | propio | no | Tabla de 7 estados. Única forma de mostrarlos. `publicando` con `role="status"` y giro exento de movimiento reducido. Nunca `primary` |
| `StageMeter` | propio | no | `role="img"` con “N de M etapas completas” |
| `ProductRow` | propio | no | `Link` de fila completa (`href` en vez de `onClick`), ícono de motivo por tono, `reason` obligatorio en los tipos cuando `tone` es `warning` o `danger` |
| `AttentionItem` | propio | no | 5 tipos, 0–2 acciones |
| `StageList` | propio | no | `<ol>`; etapas navegables como `Link`, bloqueadas como `<div aria-disabled>` con el motivo; `aria-current="step"` |
| `ReviewCard` | propio | sí | Presentacional (original / propuesta / edición). El flujo (avance a los 200 ms con `ease-exit`, toast con Deshacer, atajos A/D/E) vive en `components/screens/review-flow.tsx` |
| `ImageTile` | propio + `@dnd-kit/sortable` | sí | 5 estados; la grilla (`ImageGrid`) maneja orden, “Portada”, descartar y recuperar, y reordenar con pulsación larga (`TouchSensor` con `delay: 250`) o arrastre directo en escritorio (`PointerSensor`) + `KeyboardSensor` |
| `SegmentedControl` | shadcn `toggle-group` (single) | sí | Conteo por opción, `block`, `aria-label`; no permite deseleccionar |
| `Field` | shadcn `input` + `label` | sí | prefijo/sufijo, `hint`, `error` (`aria-invalid` + `aria-describedby`), `ai` (destello en la ayuda), 16px, `inputMode` numérico con `$`; controlado o no |
| `PriceBreakdown` | propio | no | Cálculo puro; los costos en `chart-1..3`, la ganancia en `chart-4`, la pérdida en `destructive` con “−”. La edición en vivo está en `price-editor.tsx` |
| `OfferPreview` | propio | no | **Única excepción de hex**: colores fijos de tienda, en un solo objeto de constantes documentado |
| `Metric` | propio | no | ícono por tendencia (check / triángulo / reloj) |
| `CampaignCard` + `Verdict` | propio | no | Acciones por defecto según el veredicto (`subir` → “Subir a $X” primary; `apagar` → “Mantener” + “Apagar” destructive) |
| `Navigation` | propio | sí (`usePathname`) | `bar`: 3 pestañas, badge de conteo en Hoy, área segura inferior. `rail`: 232px, marca “DropFlex” en Geist 600, Ajustes al pie |
| `TopBar` | propio | no | `back` como `Link` con `aria-label`; `large` en las raíces; `actions` |
| `Toast` | `sonner` | sí | `toast()` envuelto en `lib/toast.ts` → `notify(message, { undo })`; un solo toast visible, 5 s, `role="status"` |
| `AssistantSheet` | `drawer` (vaul) | sí | `< lg`: Drawer al 60% de alto (snap point) sobre `scrim`, sin desmontar la pantalla de atrás. `≥ lg`: `<aside>` fijo de 340px. Chip de contexto, mensajes, `apply` (crea propuesta `generado`), sugerencias, redacción. Las respuestas son de ejemplo (sin IA real todavía) |

Además, piezas del shell que no son componentes del sistema: `StickyActions` (la barra `df-sticky` en móvil, alineada a la derecha en escritorio), `SummaryTiles` (resumen de Hoy), `SectionTitle`, `Group` (`df-group`), `EmptyState` y `Skeleton*`.

## 6. Dependencias

- Producción: `sonner`, `vaul`, `@radix-ui/react-toggle-group` (vía `shadcn add toggle-group drawer sonner`), `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
- Con v4: `tailwindcss@^4`, `@tailwindcss/postcss`, `tw-animate-css`; se quitan `tailwindcss-animate` y `autoprefixer`.
- Desarrollo: `@playwright/test` (+ `npx playwright install chromium`, unos 150 MB), `@axe-core/playwright`, `tsx` para los scripts.
- Revisar después: `eslint-config-next` está en 15.3.1 con Next 16. Solo lo subo si el lint lo exige.

## 7. Shell, rutas y auth

- `app/(app)/layout.tsx`: el proxy ya redirige sin sesión (cuando hay env vars). Como defensa adicional, el layout valida `supabase.auth.getClaims()` dentro de un `<Suspense>` (obligatorio con `cacheComponents`) y redirige a `/auth/login`. La condición de env vars es la misma que en el proxy, para que el proyecto siga corriendo sin Supabase configurado.
- Layout: `< lg` → contenido + `Navigation bar` fija abajo (`pb-[env(safe-area-inset-bottom)]`), cada pantalla pone su `TopBar`. `≥ lg` → grilla `[rail 232px] [main] [asistente 340px si está abierto]`. Entre `md` y `lg`, las listas pasan a dos columnas.
- `AssistantProvider` (cliente) en el layout: guarda `{ open, context: { product, stage } }`. Cada pantalla declara su contexto con `<AssistantContext product="…" stage="…" />`. El destello de la `TopBar` llama a `open()`. No es una ruta.
- Conteo de Hoy: `getTodayQueue().length`, pasado desde el layout (server) a `Navigation`.

## 8. Pantallas (Fase 4)

Textos y cifras literales de `bundle.js` (`ScreenHoy`, `ScreenProductos`, `ScreenProducto`, `ScreenRevision`, `ScreenImagenes`, `ScreenPrecio`, `ScreenCampanas`, `ScreenAsistente`, `ScreenDeskProducto`, `ScreenDeskCampanas`). Las rutas que la referencia no dibuja (`/campaigns/[id]`, `/settings`, detalle de productos distintos del Corrector) se componen solo con componentes existentes y textos en el mismo tono; lo marco como decisión propia en el resumen final.

- Por defecto, Server Components; `"use client"` solo en `review-flow`, `image-picker`, `price-editor`, `product-filter` (filtro por `searchParams`, así que la lista sigue siendo server), el asistente, la navegación y el selector de tema.
- La acción principal va en `StickyActions`: fija abajo en móvil (encima de la barra de pestañas, `z-sticky`) y alineada a la derecha del bloque en escritorio.
- `loading.tsx` con esqueletos que respetan el layout; `error.tsx` con qué pasó y cómo seguir (“No pudimos cargar tus productos” + “Reintentar”); estados vacíos en cada lista.

## 9. Verificación por fase

| Fase | Verificación |
|---|---|
| 1 | `build` + `lint` (tras los `ignores`) + `tsc`; `/dev/tokens` en claro y oscuro revisada en el navegador; `CLAUDE.md` |
| 2 | `/dev/components` capturada con Playwright y comparada con `design-system/screenshots/componentes/` (D1) |
| 3 | Navegación móvil/escritorio, redirecciones con y sin sesión (con env vars de prueba si me las das; si no, verifico la lógica sin sesión real), auth en español |
| 4 | Las 8 pantallas × 2 anchos contra las capturas de referencia |
| 5 | `build`/`lint`/`tsc` limpios; capturas en `docs/capturas/`; axe en cada ruta y tema; recorrido con teclado; grep de valores sueltos; resumen |

Para verificar `(app)/` sin Supabase configurado, el proxy deja pasar (no hay env vars), así que las capturas y axe corren sin sesión. Si quieres que pruebe el flujo real de login, necesito un `.env.local` con un proyecto de prueba.
