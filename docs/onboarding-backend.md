# Backend del onboarding

El onboarding de `design-system/onboarding.md` funciona contra **Shopify y Meta reales**, con el estado en Supabase. El diseño y las decisiones están en `docs/spec-migracion-conexiones.md`. La generación con IA **sigue simulada** (por tiempo), porque está fuera del alcance de esa migración.

| Pieza | Implementación |
|---|---|
| Estado del onboarding | Tabla `onboarding`, una fila por comerciante (`lib/onboarding/store.ts`) |
| Cuenta (O1) | Supabase Auth (`/auth/sign-up`; la confirmación vuelve a `/onboarding`) |
| Autorizar Shopify | App pública no embebida con **instalación administrada** (`shopify.app.toml`) y authorization code grant con tokens offline que vencen |
| Importar productos | Admin API (GraphQL), por tramos con lease, hacia `catalog_items` (`lib/integrations/shopify/import.ts`) |
| Recomendados | Ventas de 30 días (pedidos sin datos de clientes) × potencial de mejora |
| Mercado | País y zona horaria desde Shopify (`SHOP_MARKET_QUERY`, al conectar); el comerciante confirma país, moneda e idioma en “Tienda conectada” (`merchant_settings`) |
| Generación de la IA | El avance del onboarding sigue **simulado** (1.º producto a los 8 s, luego cada 18 s). La IA real corre por producto: ver `docs/pipeline-ia.md` |
| Autorizar Meta | Facebook Login for Business (`config_id`), token largo y `debug_token` |
| Cuentas, páginas y píxeles | Marketing API con `appsecret_proof`, validados en el servidor al guardar |
| Tokens | Supabase Vault (`set/get/delete_integration_token`, solo `service_role`) |

## Código

- `lib/onboarding/`
  - `service.ts`: funciones puras (paso pendiente, selección, números, generación simulada).
  - `store.ts`: arma el estado desde Supabase.
  - `http.ts`: errores `{ error, field }` y el patrón leer → cambiar → guardar → snapshot.
  - `catalog.ts`: lecturas de `catalog_items`.
  - `errors.ts`: clave de error → texto.
  - `client.ts`: cliente tipado.
  - `guard.ts`: redirige al paso pendiente.
- `lib/integrations/`, todo `server-only`:
  - `env.ts`, `admin.ts` (service_role), `session.ts`, `oauth-state.ts` (state firmado y nonce en cookie) y `tokens.ts` (Vault);
  - `shopify/`: `oauth`, `client`, `queries`, `connection`, `import`, `catalog`, `start`, `webhooks`;
  - `meta/`: `oauth`, `client`, `assets`, `select`, `connection`, `signed-request`.
- `supabase/migrations/20260923000000_integrations.sql`: tablas, RLS de solo lectura para el dueño y RPCs de Vault.

## Rutas

Todas responden JSON, salvo los callbacks y la instalación, que redirigen. Los errores traen `{ error, field? }` con un mensaje en español que dice qué pasó y qué hacer. Sin sesión, la API responde 401.

| Método y ruta | Cuerpo | Respuesta |
|---|---|---|
| `GET /api/onboarding/state` | — | `OnboardingSnapshot`. También empuja la importación |
| `POST /api/onboarding/shopify/connect` | `{ shop }` | `{ authorizeUrl }`. Errores: 400 o 404 `shop`, y 409 `shop` si la tienda es de otra cuenta |
| `GET /api/onboarding/shopify/install` | `?hmac&host&shop&timestamp` | App URL: valida el HMAC y arranca el OAuth. Sin sesión, guarda la tienda y lleva a crear la cuenta |
| `GET /api/onboarding/shopify/resume` | — | Retoma la instalación después del login |
| `GET /api/onboarding/shopify/callback` | `?code&hmac&shop&state&timestamp` | 307 → `/onboarding/shopify` |
| `DELETE /api/onboarding/shopify` | — | `{ snapshot }`: desconecta (borra el token) |
| `POST /api/onboarding/market` | `{ countryCode, currency, language }` | `{ snapshot }`: confirma el mercado (“Tienda conectada” o Ajustes). 400 con `field`, 409 sin Shopify |
| `GET /api/onboarding/shopify/products` | — | `{ recommended, all, total, defaultSelection }` |
| `POST /api/onboarding/products` | `{ ids }` | `{ snapshot }`. 400 `ids` |
| `GET /api/onboarding/numbers` | — | `{ suggested, currency, source }` |
| `POST /api/onboarding/numbers` | `{ deliveredOf10, shipping, maxCpa }` o `{ sugeridos: true }` | `{ snapshot }` y empieza la generación |
| `GET /api/onboarding/generation` | — | `GenerationStatus` |
| `POST /api/onboarding/meta/connect` | — | `{ authorizeUrl }`. 409 sin Shopify |
| `GET /api/onboarding/meta/callback` | `?code&state` | 307 → `/onboarding/meta/accounts` o `/onboarding/meta` |
| `GET /api/onboarding/meta/assets` | — | `MetaAssets`, con `pixelsByAccount` |
| `POST /api/onboarding/meta/assets` | `{ account, page, pixel }` | `{ snapshot }` y termina el onboarding |
| `POST /api/onboarding/meta/skip` | — | `{ snapshot }`: Meta queda pendiente |
| `DELETE /api/onboarding/meta` | — | `{ snapshot }`: quita los permisos y borra el token |
| `POST /api/onboarding/checklist` | `{ hidden }` | `{ snapshot }` |
| `POST /api/webhooks/shopify` | cuerpo de Shopify | `app/uninstalled`, `customers/data_request`, `customers/redact` y `shop/redact` |
| `POST /api/webhooks/meta/deauthorize` | `signed_request` | Revoca la conexión |
| `POST /api/webhooks/meta/data-deletion` | `signed_request` | `{ url, confirmation_code }` (estado en `/auth/data-deletion/<código>`) |
| `GET /api/cron/connections` | `Authorization: Bearer CRON_SECRET` | Vencimiento de tokens de Meta (diario, `vercel.json`) |

`proxy.ts` deja pasar sin sesión `/api/webhooks/*`, `/api/cron/*` y `/api/onboarding/shopify/install`, que se autentican solos.

## Poner en marcha

1. Aplica la migración en Supabase (con Vault habilitado) y completa `.env.local` con `.env.example`.
2. Shopify:
   1. `shopify app config link` para `shopify.app.toml` y `shopify.app.dev.toml`;
   2. reemplaza `APP_URL` y `DEV_TUNNEL_URL`;
   3. `shopify app deploy --config dev`.
   4. Solicita el acceso a *Protected customer data* por `read_orders`.
3. Meta:
   1. app de tipo Business con una configuración de Facebook Login for Business (sus permisos van en `META_LOGIN_CONFIG_ID`);
   2. URI de redirección `<APP_URL>/api/onboarding/meta/callback`;
   3. URL de desautorización `<APP_URL>/api/webhooks/meta/deauthorize`;
   4. URL de borrado de datos `<APP_URL>/api/webhooks/meta/data-deletion`.
4. `npm run dev`, `/auth/create-account` y conectar una tienda de desarrollo.

## Probar

```bash
npm test                    # OAuth, HMAC, state, signed_request, catálogo, activos de Meta y lógica pura
TEST_EMAIL=… TEST_PASSWORD=… npm run check:onboarding   # usuario con una tienda de desarrollo ya conectada
```

## Pendiente

- **Generación con IA:** hoy `saveNumbers` guarda los productos elegidos y el avance se calcula por tiempo. Hay que reemplazarla por la cola de jobs.
- **Tasa de entrega desde los pedidos** (Paso 3, spec D7): hasta entonces, el valor sugerido va sin destello.
- **Marcas:** `ProviderMark` es genérico. Hay que usar los logos y botones oficiales de Shopify, Meta y Google según sus guías de marca.
