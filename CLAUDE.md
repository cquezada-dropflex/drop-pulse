# DropFlex

Herramienta para comerciantes de dropshipping con pago contra entrega: la IA genera el contenido de cada producto (textos, imágenes, anuncios) y el comerciante decide qué se publica en su tienda y en Meta Ads. Mobile first: el usuario trabaja desde el teléfono, en ratos cortos, y necesita saber en segundos qué le toca decidir.

## Stack

- Next.js 16 (App Router, Turbopack, `cacheComponents: true`, `proxy.ts` en lugar de `middleware.ts`), React 19, TypeScript.
- Tailwind CSS v4 (sin `tailwind.config.*`: los tokens viven en `app/globals.css`) + `tw-animate-css`.
- shadcn/ui (new-york) en `components/ui/`, sobre `radix-ui`, `vaul` (drawer) y `sonner` (toast).
- Supabase Auth con `@supabase/ssr`. Íconos con `lucide-react`. Tema con `next-themes` (`attribute="class"`, `defaultTheme="system"`).
- Fuentes Geist y Geist Mono con `next/font/google` (`--font-geist-sans` / `--font-geist-mono` → `font-sans` / `font-mono`).

## Fuente de verdad: `design-system/`

Todo color, medida, radio, tipografía, duración y texto de UI sale de `design-system/`. No inventes valores.

- `README.md`: principios, voz, fundamentos visuales, ciclo de vida, accesibilidad.
- `arquitectura.md`: navegación, rutas y por qué.
- `onboarding.md`: flujo de alta (Shopify obligatorio, Meta Ads opcional), decisiones y estados.
- `tokens.json`: todos los tokens (colores claro/oscuro, tipografía, espaciado, radios, sombras, duraciones, easing, medidas, z-index, breakpoints).
- `export/globals.css`: tokens para Tailwind v4, copiados en `app/globals.css`.
- `reference/index.d.ts`: props de cada componente. `reference/<Componente>/README.md`: comportamiento, estados y textos.
- `reference/bundle.css` + `reference/bundle.js`: implementación de referencia con las medidas exactas y los textos y cifras de las pantallas de ejemplo (`Screen*`).
- `screenshots/`: capturas de referencia generadas desde las previews.

Las medidas de `bundle.css` que no están en `tokens.json` se declaran en el bloque **“Derivados de design-system/reference/bundle.css”** de `app/globals.css` (`text-micro`, `text-tab`, `text-small`, `text-row`, `text-topbar`, `tracking-label`, `rounded-swatch|kbd|segment`, `--stroke-strong`, `scale-press`). Si falta una, agrégala ahí citando la regla de `bundle.css`; nunca uses un valor suelto.

`lib/tokens.ts` lee `design-system/tokens.json` cuando un valor se necesita en TypeScript (por ejemplo, `themeColor`).

## Componentes: `components/df/`

- Un archivo por componente (`components/df/button.tsx`, `status-badge.tsx`…), en TypeScript, con las props de `reference/index.d.ts` y el comportamiento de `reference/<Componente>/README.md`. Se exportan desde `components/df/index.ts`.
- Se apoyan en shadcn (`components/ui/`) cuando encaja, sin duplicar primitivas: `Button`/`IconButton` → `button`, `SegmentedControl` → `toggle-group`, `Field` → `input` + `label`, `Toast` → `sonner`, `AssistantSheet` → `drawer`. `Icon` → `lucide-react` con `strokeWidth={1.75}`.
- Clases Tailwind con tokens: nada de hex, `rgb()` ni `px` arbitrarios en `components/` ni en `app/`. La única excepción es `OfferPreview`, que usa colores fijos de tienda a propósito. La paleta por defecto de Tailwind está desactivada (`--color-*: initial`): solo existen los colores de DropFlex.
- Por defecto, Server Components; `"use client"` solo donde hay interacción.
- `Button` usa `secondary` por defecto (como `bundle.js`); `primary` se declara siempre explícitamente.

## Reglas que no se negocian

- **`StatusBadge` es la única forma de mostrar los 7 estados del ciclo de vida** (`generado`, `revision`, `aprobado`, `rechazado`, `publicando`, `publicado`, `error`): color + ícono + palabra, siempre los tres.
- **`primary` (azul cobalto) nunca es un color de estado.** Solo para: la acción principal (una por vista), la pestaña activa, la selección (`primary-soft`), el foco y los enlaces. Los estados usan `success`, `warning` y `destructive`.
- Área táctil mínima de 44px (`size-touch`) en todo control, aunque el dibujo sea menor.
- Etapas bloqueadas con `aria-disabled` y el motivo en texto. `IconButton` siempre con `aria-label`. `role="status"` en `publicando` y en el toast.
- `ReviewCard`: al aceptar o descartar avanza sola a la siguiente propuesta (200ms, `ease-exit`) y muestra un toast con “Deshacer”; sin diálogos de confirmación. En escritorio, atajos A / D / E.
- `ImageTile`: tocar elige y asigna el número de orden; la 1 es “Portada”; mantener presionado reordena; descartar apaga y deja “Recuperar”.
- `PriceBreakdown`: la ganancia se recalcula en vivo; costos en `chart-1..3`, ganancia en `chart-4`, pérdida en `destructive` con signo menos.
- Dinero con `Intl.NumberFormat('es-CL')` → `$24.990`; negativos con signo menos tipográfico → `−$1.200`. Cifras siempre con `tabular-nums`.
- Foco: 2px del color de fondo + 2px sólidos de `ring` (regla global en `app/globals.css`). `prefers-reduced-motion` lleva todo a 0ms salvo el indicador de publicación (`.motion-exempt`).
- WCAG 2.1 AA en claro y en oscuro.
- Área segura: `env(safe-area-inset-bottom)` (`pb-safe`) en la barra inferior y en las barras de acción fijas.

## Rutas

- **Las rutas van siempre en inglés** (segmentos de URL, carpetas de `app/`, rutas de API y parámetros de búsqueda): `/today`, `/products/[id]/images`, `/api/onboarding/products`, `?filter=stuck`. Los textos visibles siguen en español.
- Pantallas: `/today`, `/products?filter=moving|stuck|published`, `/products/[id]` (`/copy`, `/images`, `/price`), `/campaigns?period=today|7|30`, `/campaigns/[id]`, `/settings`. Onboarding: `/auth/create-account`, `/onboarding/shopify|products|numbers|meta|meta/accounts|done`. Integraciones: `/api/onboarding/*`, `/api/webhooks/*`, `/api/cron/*`.
- Las claves internas siguen el vocabulario del design system (`StageKey` `textos|imagenes|precio`, `ProductFilter` `detenidos…`); su traducción a URL vive en `lib/routes.ts` (`productHref`, `FILTER_PARAM`). No armes a mano una URL de etapa.
- Las rutas antiguas en español redirigen de forma permanente (`redirects` en `next.config.ts`). `design-system/arquitectura.md` es la copia del artifact y conserva los nombres originales.

## Textos de UI

Español neutro con tuteo, nunca voseo ni “usted”: “Revisa”, “Elige”, “Tienes 6 decisiones” (nunca “Revisá”, “Elegí”). Verbo primero en botones, sentence case, sin signos de exclamación ni emojis. Los errores dicen qué pasó y qué hacer; los estados detenidos dicen qué falta y desde cuándo. Ver “Contenido y voz” en `design-system/README.md`.

## No tocar sin pedirlo

`proxy.ts`, `lib/supabase/*` y la lógica de auth (las llamadas a `supabase.auth.*`). Excepción ya autorizada (spec D1): las rutas públicas que se autentican solas, el 401 JSON de `/api/*` y el `?next=` del login en `lib/supabase/proxy.ts`.

## Datos

- Tipos en `lib/types.ts`; datos de ejemplo en `lib/mock/`. La UI lee **solo** a través de `lib/data/*.ts` (`getTodayQueue()`, `getProducts(filter)`, `getProduct(id)`…). Para pasar a Supabase se cambia el cuerpo de esas funciones: ver `docs/esquema-supabase.md`.
- Pantallas en `app/(app)/`; piezas interactivas de pantalla en `components/screens/`; shell (layout, asistente, barra fija, estados) en `components/shell/`.

## Onboarding

- Rutas: `/auth/create-account` (O1), `/onboarding/*` (pasos 1–4 y Listo), `SetupChecklist` en Hoy y Conexiones en Ajustes. Pasos en `components/onboarding/steps/`.
- Backend **real**: estado en Supabase (`lib/onboarding/store.ts`), Shopify y Meta en `lib/integrations/` (`server-only`), tokens en Vault, migración en `supabase/migrations/`. Solo la generación con IA sigue simulada. Contrato, rutas y puesta en marcha: `docs/onboarding-backend.md`; decisiones: `docs/spec-migracion-conexiones.md`.
- Shopify: app no embebida con instalación administrada (`shopify.app.toml` / `shopify.app.dev.toml`); los alcances viven ahí y en `SHOPIFY_SCOPES` de `lib/integrations/shopify/oauth.ts`, siempre iguales.
- Dinero del catálogo en la moneda de la tienda: `money(value, currency)`; CLP es el valor por defecto.
- Los estados de conexión usan `ConnectionCard` / `StateChip`, nunca `StatusBadge` (que es solo para el ciclo de vida del contenido).
- `ProviderMark` es genérico: no dibujes logos de Shopify, Meta ni Google.

## Verificación

```bash
npm run build
npm run lint
npm run typecheck
npm test                     # vitest: lib/**/*.test.ts
npm run check:valores        # sin hex, rgb() ni px sueltos en app/ y components/
```

Con `npm run dev` corriendo:

```bash
npm run check:a11y           # axe en cada ruta, 390 y 1280px, claro y oscuro
npm run check:teclado        # orden de foco, foco visible y atajos A / D / E
npm run capturas             # docs/capturas/pantallas + montajes contra design-system/screenshots
npm run capturas:componentes # /dev/components contra las capturas de referencia
TEST_EMAIL=… TEST_PASSWORD=… npm run check:onboarding   # usuario con tienda de desarrollo conectada; capturas y axe
```

- `/dev/tokens` y `/dev/components` (solo en desarrollo) para revisar tokens y componentes en claro y oscuro.
- Plan y decisiones: `docs/plan-design-system.md`.
