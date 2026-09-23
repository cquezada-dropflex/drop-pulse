# Spec: migrar las conexiones reales de Shopify y Meta al onboarding de v2

> Estado: **implementado (F1–F6) el 2026-09-23**, sin probar todavía contra Shopify y Meta reales. Falta F0 (crear las apps y aplicar la migración) y la verificación en vivo. El detalle de lo construido está en `docs/onboarding-backend.md`.
> Fecha: 2026-09-23.
> Origen: backend de `dropflex` (el proyecto que se depreca).
> Destino: `dropflex-v2`, onboarding O1–O9.

## 0. Resumen

El onboarding de v2 ya tiene la UI y el contrato de la API: las rutas de `app/api/onboarding/*`, los DTOs de `lib/onboarding/types.ts` y los estados de `ConnectionCard`. Lo que está simulado es lo de atrás: una cookie, `/simulation/*` y un catálogo falso. Este spec reemplaza ese backend simulado por conexiones reales con Shopify y Meta, **reutilizando lo que funcionaba en `dropflex` y corrigiendo lo que no**.

Reglas de la migración:

1. **La UI no cambia.** Del proyecto base no se trae ningún componente, pantalla, texto ni flujo. Todo lo visible sigue saliendo de `design-system/` y `components/df/`. La única excepción son los textos de error nuevos (§7), que siguen la voz de `design-system/README.md`.
2. **El contrato se mantiene.** Las rutas, cuerpos y respuestas de `docs/onboarding-backend.md` no cambian, salvo dos ajustes puntuales y justificados (§6.4 y §5.6).
3. **Se porta la lógica, no el código tal cual.** Cada pieza del base se revisa contra la lista de fallas (§2) antes de pasar.
4. **Fuera de alcance:** la generación con IA (sigue simulada), la publicación en Shopify, el motor de anuncios, las campañas, COD, los temas y Nuvemshop.

---

## 1. Qué hay hoy en cada proyecto

### 1.1 dropflex-v2 (destino)

| Pieza | Archivo | Hoy |
|---|---|---|
| Estado del onboarding | `lib/onboarding/store.ts` | Cookie `df_onboarding` en base64, sin firma |
| Lógica | `lib/onboarding/service.ts` | Funciones puras sobre el estado y la hora |
| OAuth de Shopify | `startShopify` y `finishShopify` | Redirige a `/simulation/shopify`; el nonce vive dentro del estado (la cookie) |
| Importación | `importStatus` y `importedProducts` | Progreso por tiempo sobre `lib/onboarding/catalog.ts` (128 productos) |
| OAuth de Meta | `startMeta` y `finishMeta` | Redirige a `/simulation/meta` |
| Activos de Meta | `metaAssets()` | Lista fija |
| Conexiones en Ajustes y Hoy | `components/onboarding/connections.tsx` y `setup-slot.tsx` | Leen el snapshot |
| Auth | `proxy.ts` y `lib/supabase/proxy.ts` | Supabase SSR; **redirige a `/auth/login` todo lo que no sea `/` ni `/auth/*`, incluido `/api/*`** |
| Base de datos | — | Sin tablas: `docs/esquema-supabase.md` es solo una propuesta |

### 1.2 dropflex (origen): lo que vale la pena portar

| Pieza | Archivo de origen | Veredicto |
|---|---|---|
| Normalización del dominio (anti-SSRF) | `lib/integrations/shopify/oauth.ts` `normalizeShopDomain` | **Portar** y unir con `normalizeShop` de v2 |
| `state` firmado con HMAC + nonce en cookie + TTL de 10 min | `oauth.ts` `signState` y `validateCallbackState` | **Portar** y agregar `purpose` (§2, falla 20) |
| HMAC del callback de Shopify (orden de claves, `timingSafeEqual`) | `oauth.ts` `verifyCallbackHmac` | **Portar** y validar `timestamp` |
| Canje de code → token | `oauth.ts` `exchangeCodeForToken` | **Portar** y validar los alcances de verdad |
| Tokens en Supabase Vault con RPCs `SECURITY DEFINER` solo para `service_role` | `20260604190000_vault_token_and_import_state.sql` | **Portar el patrón** con nombres propios por proveedor |
| Cliente GraphQL de Shopify (reintentos, `THROTTLED`, clases de error) | `lib/integrations/shopify/client.ts` | **Portar**, sin reintentar mutaciones y con timeout |
| Queries de tienda y productos | `lib/integrations/shopify/queries.ts` | **Portar** solo `shop` y `products`, más las nuevas de §5.4 |
| Importación paginada por cursor | `lib/integrations/shopify/import.ts` | **Portar la idea**, contra la tabla nueva |
| HMAC de webhooks sobre el cuerpo crudo | `lib/integrations/shopify/webhook.ts` | **Portar** |
| Tests de OAuth, HMAC, cliente e importación | `lib/integrations/shopify/*.test.ts` | **Portar** (se necesita vitest en v2) |
| Canje short → long-lived de Meta | `lib/ads/meta/oauth.ts` | **Portar** con `appsecret_proof` y `debug_token` |
| Cliente Graph (clases de error por código) | `lib/ads/meta/client.ts` | **Portar**, corrigiendo el mapeo de 100 y 403 y sin reintentar POST |
| Descubrimiento de páginas y píxeles | `lib/ads/launch/discovery.ts` y `adapter.ts` | **Portar** las consultas, no el flujo |

### 1.3 Lo que **no** se trae

- Pegar un token de custom app (`connectShopifyWithToken`). Es el origen de la falla 1 y no existe en el diseño de v2.
- La tenencia múltiple del base: `stores`, `memberships`, la cookie `active_store` y los roles. v2 es **un comerciante = un usuario** (`user_id = auth.uid()`, ver `docs/esquema-supabase.md`).
- Vincular todas las cuentas publicitarias al conectar y copiar las campañas al conectar (`persistMetaConnection`).
- Los alcances de temas, páginas de tienda, publicación en páginas de Facebook e inventario de escritura.
- El refresco de tokens de larga duración con `fb_exchange_token` (`lib/ads/refresh.ts`).
- Los webhooks de pedidos COD, `theme-kit` y todo lo de Nuvemshop.
- Cualquier pantalla, componente o texto de `app/protected/*` y `components/onboarding/*` del base.

---

## 2. Fallas del base y cómo las cierra v2

| # | Falla en `dropflex` | Cómo se resuelve en v2 |
|---|---|---|
| 1 | Las tiendas con token pegado no pasan el HMAC de los webhooks (se firman con otro secreto) | Solo OAuth de la app pública; sin token pegado |
| 2 | No están los webhooks GDPR obligatorios de Shopify | `customers/data_request`, `customers/redact` y `shop/redact` implementados (§5.5) |
| 3 | `app/uninstalled` se registra a mano, ignora errores y no limpia | Declarado en `shopify.app.toml`; borra el token de Vault y marca `revoked` (§5.5) |
| 4 | Pegar un token pisa el OAuth y guarda alcances falsos; cualquiera con token queda como `owner` | Se guardan los alcances **devueltos** por Shopify. Una tienda ya vinculada a otro usuario → error (§5.3) |
| 5 | Los alcances de `.env.example` y los del código no coinciden; falta `read_orders` | Una sola lista en código (§5.1) y validación de **todos** los requeridos |
| 6 | Esquemas de env inconsistentes (versión con y sin valor por defecto) | Un solo `lib/integrations/env.ts` con zod, que falla al arrancar |
| 7 | La instalación desde Shopify ignora `hmac` y el login no tiene "volver a" | La instalación desde Shopify valida HMAC y lleva a `/auth/create-account` o `/auth/login` con retorno (§5.2) |
| 8 | Tokens offline sin vencimiento; Shopify hoy exige tokens que vencen en apps públicas nuevas | `expiring=1` más refresh token en Vault y refresco automático en el cliente (§5.3) |
| 9 | Secreto de Vault llamado `nuvemshop_token_*`; nunca se borra | `shopify_token_<user_id>` y `meta_token_<user_id>`; se borran al desconectar o desinstalar |
| 10 | Se reintentan mutaciones en 5xx (duplica efectos) y no hay timeout | Solo se reintentan lecturas; timeout de 15 s con `AbortSignal.timeout` |
| 11 | No se valida el `timestamp` del callback; el nonce no se limpia al fallar | Ventana de 10 min para el `timestamp`; la cookie del nonce se borra en **toda** salida |
| 12 | Graph `v21.0` fijo en el código | `META_GRAPH_VERSION` en env, validado; verificar la versión vigente al implementar |
| 13 | Vincula todas las cuentas publicitarias (solo la 1.ª página, incluidas las deshabilitadas) | El comerciante elige **una** cuenta, página y píxel (O7); se pagina todo; las deshabilitadas se muestran con su motivo |
| 14 | El callback hace trabajo pesado (copia campañas) | El callback solo canjea el token y guarda; los activos se consultan en O7 |
| 15 | El refresco con `fb_exchange_token` no está documentado para tokens largos; un 5xx de Meta marca re-auth | Sin refresco: se lee el vencimiento con `debug_token` y se pide volver a conectar antes de que venza. Los 5xx no cambian el estado |
| 16 | Sin callbacks de desautorización ni de borrado de datos de Meta | `/api/webhooks/meta/deauthorize` y `/api/webhooks/meta/data-deletion` (§6.6) |
| 17 | Falta `config_id` (FLfB), falta `auth_type=rerequest` y los alcances se tragan errores | FLfB con `config_id`; `rerequest` al reconectar; alcances desde `debug_token` |
| 18 | Sin `appsecret_proof`; los IDs de página y píxel no se validan en el servidor; el código 100 se toma como NotFound | `appsecret_proof` en toda llamada; la selección se valida contra lo consultado; clases de error corregidas |
| 20 | Un mismo `OAUTH_STATE_SECRET` sin propósito; un `state` sirve para otro proveedor | El `state` lleva `purpose: "shopify" \| "meta"` y se valida |

---

## 3. Arquitectura en v2

```
app/api/onboarding/*            ← mismas rutas y contrato (la UI no cambia)
app/api/webhooks/shopify        ← nuevo: app/uninstalled + GDPR
app/api/webhooks/meta/*         ← nuevo: deauthorize, data-deletion
app/api/cron/connections        ← nuevo: revisa vencimientos de Meta

lib/onboarding/
  types.ts        (sin cambios, salvo §6.4)
  service.ts      funciones puras: pendingStep, canVisit, snapshot, validaciones
  store.ts        → lee y escribe en Supabase (tabla onboarding + conexiones)
  http.ts, client.ts, guard.ts, paths.ts  (sin cambios de contrato)

lib/integrations/                ← nuevo, todo "server-only"
  env.ts            zod de SHOPIFY_*, META_*, OAUTH_STATE_SECRET, CRON_SECRET
  oauth-state.ts    firmar y validar el state {purpose, uid, nonce, iat, shop?} + cookie del nonce
  tokens.ts         Vault: setToken, getToken, deleteToken (RPC con service_role)
  admin.ts          cliente service_role (ver §9, decisión D1)
  shopify/
    oauth.ts        normalizeShop, authorizeUrl, verifyHmac, exchangeCode, verifyInstall
    client.ts       GraphQL Admin con reintentos solo para lecturas
    queries.ts      SHOP, PRODUCTS_COUNT, PRODUCTS, ORDERS_30D
    import.ts       importación paginada con lease, hacia catalog_items
    catalog.ts      Shopify → CatalogProduct (issues, score, sales30)
    webhooks.ts     HMAC y handlers de topics
  meta/
    oauth.ts        authorizeUrl (FLfB), exchangeCode → long-lived, debugToken
    client.ts       Graph con appsecret_proof, paginación y clases de error
    assets.ts       adAccounts, pages, pixels → MetaAssets + sugerencia
    signed-request.ts  para los callbacks de desautorización y borrado
```

**Principio:** `service.ts` sigue siendo puro. Hoy mezcla lógica de pasos con la simulación, así que se separa:

- `pendingStep`, `canVisit`, `snapshot`, `saveSelection`, `validateNumbers` y `saveNumbers` **se quedan**, con el estado que llega de la base.
- `startShopify`, `finishShopify`, `importStatus`, `startMeta`, `finishMeta` y `metaAssets` pasan a `lib/integrations/*`, porque hacen I/O. `service.ts` recibe su resultado ya resuelto.
- Lo simulado (`catalog.ts`, `/simulation/*`) queda detrás de `INTEGRATIONS_MODE=simulation` para desarrollo y `check:onboarding` (decisión D4).

### 3.1 Cómo cambia `OnboardingState`

El estado de las conexiones sale de la cookie y pasa a sus propias tablas. `OnboardingSnapshot` **no cambia de forma**: se arma leyendo las tres fuentes.

| Campo actual | Fuente nueva |
|---|---|
| `shop.domain/status/error/connectedAt` | `shopify_connections` |
| `shop.nonce` | **Se elimina del estado**: vive en la cookie httpOnly firmada `df_oauth_shopify` |
| `selected`, `numbers`, `generation`, `finishedAt`, `checklistHidden` | Tabla `onboarding` |
| `meta.status/account/page/pixel/error` | `meta_connections` |
| `meta.nonce` | Cookie `df_oauth_meta` |
| `account` | Sesión de Supabase (`getClaims()`) |

---

## 4. Base de datos (migraciones nuevas en v2)

Todas las tablas usan `user_id = auth.uid()` con RLS de **solo lectura** para el dueño. Las escrituras de conexiones se hacen con `service_role` desde el servidor, nunca desde el cliente, siguiendo `docs/esquema-supabase.md`.

```sql
create type connection_status as enum ('connecting', 'action', 'connected', 'error', 'revoked');
create type import_status     as enum ('pending', 'importing', 'complete', 'failed');

create table onboarding (
  user_id          uuid primary key references auth.users on delete cascade,
  selected         text[]      not null default '{}',      -- catalog_items.shopify_id en orden
  numbers          jsonb,                                  -- { deliveredOf10, shipping, maxCpa, suggested }
  generation       jsonb,                                  -- { startedAt, productIds } (sigue simulada)
  finished_at      timestamptz,
  checklist_hidden boolean     not null default false,
  updated_at       timestamptz not null default now()
);

create table shopify_connections (
  user_id            uuid primary key references auth.users on delete cascade,
  shop_domain        text not null unique,                 -- *.myshopify.com; una tienda = un comerciante
  shop_gid           text,
  shop_name          text,
  currency           char(3),
  scopes             text[] not null default '{}',         -- las que devolvió Shopify, no las pedidas
  status             connection_status not null default 'connecting',
  error_code         text,                                 -- clave estable; el texto sale de §7
  token_expires_at   timestamptz,                          -- null = token offline sin vencimiento
  import_status      import_status not null default 'pending',
  import_cursor      text,
  imported_count     integer not null default 0,
  total_count        integer,
  import_lease_until timestamptz,                          -- evita dos importaciones a la vez
  connected_at       timestamptz,
  uninstalled_at     timestamptz,
  updated_at         timestamptz not null default now()
);

-- Espejo del catálogo para O4. NO es la tabla `products` del ciclo de vida:
-- a `products` solo pasan los que el comerciante elige.
create table catalog_items (
  user_id        uuid not null references auth.users on delete cascade,
  shopify_id     text not null,                            -- gid://shopify/Product/…
  title          text not null,
  handle         text,
  image_url      text,
  price          integer not null,                         -- unidades de la moneda de la tienda (CLP: pesos)
  compare_at     integer,
  cost           integer,                                  -- inventoryItem.unitCost; null si no hay
  media_count    smallint not null default 0,
  has_description boolean not null default false,
  sales_30d      integer not null default 0,
  status         text not null,                            -- ACTIVE | DRAFT | ARCHIVED
  synced_at      timestamptz not null default now(),
  primary key (user_id, shopify_id)
);

create table meta_connections (
  user_id               uuid primary key references auth.users on delete cascade,
  fb_user_id            text,
  status                connection_status not null default 'connecting',
  error_code            text,
  scopes                text[] not null default '{}',
  token_expires_at      timestamptz,
  data_access_expires_at timestamptz,
  ad_account_id         text,                              -- act_…
  ad_account_name       text,
  ad_account_currency   char(3),
  page_id               text,
  page_name             text,
  pixel_id              text,
  pixel_name            text,
  connected_at          timestamptz,
  updated_at            timestamptz not null default now()
);

-- Idempotencia de webhooks (Shopify reintenta; se deduplica por X-Shopify-Webhook-Id)
create table webhook_events (
  id          text primary key,
  provider    text not null,
  topic       text not null,
  received_at timestamptz not null default now()
);

-- Seguimiento de las solicitudes de borrado de Meta (la URL de estado que exige Meta)
create table data_deletion_requests (
  confirmation_code text primary key,
  provider          text not null,
  external_user_id  text not null,
  status            text not null default 'received',
  created_at        timestamptz not null default now()
);
```

**Vault:** mismas RPCs `SECURITY DEFINER` que en el base, con `revoke … from public, anon, authenticated; grant execute … to service_role`, pero con nombres por proveedor y con borrado:

```sql
set_integration_token(p_provider text, p_user_id uuid, p_token text)   -- secreto: '<provider>_token_<user_id>'
get_integration_token(p_provider text, p_user_id uuid) returns text
delete_integration_token(p_provider text, p_user_id uuid)              -- nuevo: borra de verdad
```

El `refresh_token` de Shopify, si existe, va en su propio secreto: `shopify_refresh_<user_id>`.

**RLS:** `select using (user_id = (select auth.uid()))` en las cuatro tablas de usuario, sin excepciones. Todas las escrituras, `onboarding` incluida, pasan por el servidor con `service_role` y el usuario verificado con `getClaims()`. `webhook_events` y `data_deletion_requests` no tienen políticas: solo `service_role`.

---

## 5. Shopify

### 5.1 App y alcances

- **Modelo (decidido, D2):** app pública **no embebida** con **instalación administrada por Shopify** (`use_legacy_install_flow = false`).
  - El comerciante acepta los permisos **dentro de Shopify**, al instalar. Cuando Shopify abre la App URL, la app ya está instalada.
  - El token se sigue obteniendo con el **authorization code grant**, porque en una app no embebida no hay session token para usar token exchange. Como los permisos ya se aceptaron, `/admin/oauth/authorize` vuelve al callback **sin mostrar otra pantalla**.
  - Con la instalación administrada, los alcances que valen son **los del toml**, no el parámetro `scope` de la URL de autorización. Verifícalo en la documentación vigente. Por eso `hasRequiredScopes` compara contra lo que devuelve el canje.
  - Si se cambian los alcances en el toml, las tiendas ya instaladas los aceptan desde Shopify la próxima vez que abran la app. El callback detecta que falta un alcance y pinta `insufficient_scope`.
- **Configuración como código:** [`shopify.app.toml`](../shopify.app.toml) en la raíz de v2. Tiene `application_url`, `[access_scopes]`, `redirect_urls`, los webhooks de la app y `compliance_topics`. Se despliega con `shopify app deploy`, que crea una versión de la app. Así se cierra la falla 3: los alcances y los webhooks quedan versionados y no se configuran a mano en el panel.
- **Alcances mínimos**, derivados de `PERMS_SHOPIFY` en `components/onboarding/permissions.ts`:
  - `read_products`: productos, variantes, imágenes y precios.
  - `write_products`: solo lo que tú apruebes (lo usará la etapa de publicar).
  - `read_inventory`: `inventoryItem.unitCost`, el costo del proveedor.
  - `read_orders`: ventas de 30 días (recomendados) y tasa de entrega (Paso 3).
- ⚠️ `read_orders` toca **datos protegidos de clientes**. Una app pública necesita la aprobación de *Protected customer data* en el Partner Dashboard, al menos el nivel 1.
  - Solo se piden pedidos con `lineItems` y estados, **sin campos de cliente**, lo que coincide con "Nunca: datos de pago ni clientes fuera de tus pedidos".
  - Hay que verificarlo en la documentación vigente antes de enviar la app a revisión.
- Una sola lista `SHOPIFY_SCOPES` en `lib/integrations/shopify/oauth.ts`, igual a la del toml. `hasRequiredScopes` exige **las cuatro**.

### 5.2 Entradas al flujo

1. **Desde DropFlex (O2)**, con `POST /api/onboarding/shopify/connect { shop }`:
   1. Exige sesión: `getClaims()`; sin usuario → 401.
   2. Normaliza con `normalizeShop`. Se unen las dos versiones: la de v2, que acepta "mitienda", el dominio o la URL, y la regex estricta del base `^[a-z0-9][a-z0-9-]*\.myshopify\.com$`.
   3. **"No encontramos esa tienda" (404 `shop`):** sondeo `GET https://<shop>/admin/oauth/authorize` sin seguir redirecciones, con timeout de 5 s. Un 404 → error de campo. Si falla la red, se deja seguir, porque el sondeo es un atajo y no una barrera. Hay que verificar qué responde Shopify hoy a una tienda inexistente.
   4. Si `shop_domain` ya está vinculada a **otro** `user_id` → 409 `shop` (§7).
   5. Genera el nonce (`randomBytes(16)`), guarda la cookie `df_oauth_shopify` (httpOnly, `SameSite=Lax`, `Secure`, 10 min) y firma el `state` `{purpose:"shopify", uid, nonce, shop, iat}`.
   6. Hace upsert de `shopify_connections` con `status='connecting'`.
   7. Responde `{ authorizeUrl }`, con la misma forma de hoy. La UI ya hace `window.location.assign`.
2. **Desde Shopify** (App Store o enlace de instalación). Es el camino principal con la instalación administrada:
   1. El comerciante hace clic en "Instalar". **Shopify** muestra los permisos del toml y el comerciante los acepta: la app queda instalada.
   2. Shopify abre la App URL `GET /api/onboarding/shopify/install?hmac&host&shop&timestamp`. Es el mismo formato que hoy llega a `https://dropflex.vercel.app/protected/onboarding/store?…&shop=qs060z-e7.myshopify.com…`. **No trae token**: es solo un lanzamiento firmado.
   3. Valida el `hmac` (HMAC-SHA256 en hex, con `SHOPIFY_API_SECRET`, sobre los parámetros ordenados sin `hmac`; se reutiliza `verifyCallbackHmac`), el `timestamp` (10 min) y la regex de la tienda. Si algo falla, responde 400 sin redirigir.
   4. **Sin sesión:** guarda la tienda en la cookie `df_pending_shop` (httpOnly, 30 min, solo el dominio ya validado) y redirige a `/auth/create-account`. Si el usuario ya tiene cuenta, va a `/auth/login` con retorno (D1). Al terminar, `/onboarding` detecta la cookie y hace el paso 5 sin volver a pedir la dirección.
   5. **Con sesión:** mismos chequeos que el punto 1 (tienda ajena → `shop_taken`), nonce y `state`, y **redirige de inmediato** a `/admin/oauth/authorize`, que vuelve sola al callback (§5.3). El usuario no ve el formulario de O2 ni una segunda pantalla de permisos.
   6. **Si la tienda ya está conectada a este usuario** (reabrir la app desde el admin de Shopify): redirige a `/onboarding` (paso pendiente) o a `/today`. No hay OAuth, salvo que el token falte o esté `revoked`.
   - El camino 1 (escribir la dirección en O2) sigue igual y es la alternativa que prevé `design-system/onboarding.md`. Si la app no está instalada en esa tienda, `/admin/oauth/authorize` muestra los permisos de Shopify y la instala en ese momento.
   - **Estado del base:** la app actual tiene *Use legacy install flow = true* (confirmado el 2026-09-23). Con ese flujo, la instalación ocurre recién al aceptar la pantalla de `/admin/oauth/authorize`. Como el base ignora el `hmac` y espera un clic en "Conectar", una instalación abandonada en ese punto nunca se completa. La instalación administrada lo resuelve.

### 5.3 Callback: `GET /api/onboarding/shopify/callback`

Mismo path. Los parámetros pasan a ser los reales (`code, hmac, shop, state, timestamp, host`). El simulado `result` desaparece en modo `live`.

Orden de validación. Cada fallo registra el motivo con `console.warn` y guarda un `error_code`:

1. `?error` o sin `code` → `denied`.
2. `verifyCallbackHmac(params, SHOPIFY_API_SECRET)`, como en el base, y **`timestamp` dentro de 10 min** → si falla, `invalid_request`.
3. La regex de la tienda.
4. `validateState`: firma, `purpose === "shopify"`, TTL, nonce igual al de la cookie (`timingSafeEqual`), `shop` del state igual al `shop` del callback y `uid` igual al de la sesión → si falla, `expired`.
5. **Siempre** se borra la cookie del nonce, también al fallar.
6. `exchangeCode`: `POST https://<shop>/admin/oauth/access_token` `{client_id, client_secret, code, expiring: 1}`, con timeout.
   - **Obligatorio en apps públicas nuevas.** La documentación de Shopify (authorization code grant) dice, en resumen, que las apps públicas nuevas deben usar tokens offline que vencen, pidiéndolos con `expiring=1`, y que Shopify entrega un refresh token junto al token de acceso.
   - Se guardan `token_expires_at` y el refresh token en Vault (`shopify_refresh_<user_id>`). `lib/integrations/shopify/client.ts` refresca el token antes de cada llamada si vence en menos de 5 minutos, con un lock por usuario para no refrescar dos veces en paralelo. Si el refresh falla con un error de autenticación → `status='error'`, `error_code='expired'`.
   - Es una diferencia con el base, que pedía tokens offline sin vencimiento (falla 8).
7. `scopes = token.scope.split(",")`; si falta alguno de §5.1 → `insufficient_scope`.
8. `SHOP` query: `shop { id name currencyCode myshopifyDomain }` y `productsCount { count }`.
9. Con `service_role`:
   - `set_integration_token('shopify', uid, token)`;
   - upsert de `shopify_connections` con `status='connected'`, `scopes`, `currency`, `total_count`, `import_status='importing'`, `imported_count=0` y `connected_at`;
   - la restricción `unique(shop_domain)` bloquea que se robe una tienda ajena.
10. Con `after()` de `next/server`, dispara el primer tramo de la importación sin demorar la respuesta.
11. Redirige con 307 a `/onboarding/shopify`. La UI ya muestra `ConnectionCard importing` cuando `snapshot.shop.status === "importing"`.

En los errores también redirige a `/onboarding/shopify`, con `status='error'` y `error_code`. `ShopForm` ya pinta `ConnectionCard error` con "Cambiar dirección" y "Reintentar".

### 5.4 Importación sin bloqueo (O3 y O4)

Hoy se simula con `IMPORT_MS`. En real:

- **Tramos:** `importChunk(userId)` toma un *lease* (`import_lease_until = now() + 60s`, con `update … where import_lease_until is null or import_lease_until < now()`).
  - Lee hasta 5 páginas de 50 productos desde `import_cursor`, hace upsert en `catalog_items`, avanza `import_cursor` e `imported_count` y suelta el lease.
  - En la última página pone `import_status='complete'`.
- **Quién la empuja:**
  - el `after()` del callback;
  - `GET /api/onboarding/state` y `GET /api/onboarding/shopify/products`: si `import_status='importing'` y no hay lease vivo, disparan otro `after(importChunk)`. Esto aprovecha el sondeo que la UI ya hace.
  - No hace falta una cola al principio. Para catálogos grandes queda la opción de migrar a una cola (Supabase Queues o Vercel Queues).
- **Query de productos**, a partir de `buildProductsQuery` del base:
  - `id title handle status descriptionHtml featuredImage{url}`
  - `mediaCount{count}` (o `media(first:10)`)
  - `variants(first:1){ price compareAtPrice inventoryItem{ unitCost{amount} } }`
  - Filtro `status:active`.
  - Se mantiene el fallback del base: si `unitCost` da `ACCESS_DENIED`, se reintenta sin costo.
- **Ventas de 30 días:** una consulta de pedidos, `orders(query:"created_at:>=<hoy-30d>")`, con `lineItems{ product{id} quantity }` y **sin campos de cliente**, agregada en `sales_30d`.
  - Corre una vez al terminar la importación, así que los recomendados mejoran cuando llega.
  - Mientras tanto, el orden usa `score`. Mismo criterio que hoy: la recomendación sale desde el primer momento.
- **Mapeo a `CatalogProduct`** (`lib/integrations/shopify/catalog.ts`):
  - `id` = el id numérico del gid, que es estable en URLs y en `selected`.
  - `price` y `cost` en unidades enteras de la moneda de la tienda.
  - `issues`, con reglas deterministas y textos del catálogo de `bundle.js`:
    - `!has_description` → "Sin descripción";
    - `media_count < 3` → "`n` imágenes";
    - `compare_at == null` → "Sin precio tachado".
    - "Título de proveedor" e "Imágenes con texto chino" quedan para cuando exista análisis por IA, no se inventan.
  - `score` = Alta con 2 o más issues, Media con 1, Baja con 0 (el mismo criterio de `catalog.ts`).
  - `recommended()` **se reutiliza tal cual**.
- **Moneda:** v2 formatea en CLP (`Intl.NumberFormat('es-CL')`). Si `currency !== 'CLP'`, ver la decisión D3.
- **Tienda sin productos:** `total_count = 0` → el estado vacío de O4 que ya existe.
- **Paso 3, `GET /api/onboarding/numbers`:** `deliveredOf10` hoy es fijo en 8.
  - Con `read_orders` se puede calcular a partir de los pedidos de 60 días (entregados y pagados sobre el total).
  - **Fuera del alcance de esta migración.** Se deja el valor sugerido y `source` sin el destello hasta implementarlo, para no marcar como calculado algo que no lo es.

### 5.5 Webhooks: `POST /api/webhooks/shopify`

- Lee el cuerpo crudo con `await req.text()`, verifica `X-Shopify-Hmac-Sha256` con el `verifyWebhookHmac` del base y deduplica por `X-Shopify-Webhook-Id` en `webhook_events`.
- Responde 200 rápido y procesa con `after()`.

| Topic | Acción |
|---|---|
| `app/uninstalled` | `delete_integration_token('shopify', uid)`; `status='revoked'`, `uninstalled_at=now()`; se conservan `catalog_items` y los productos del comerciante. En Hoy y Ajustes se ve `ConnectionCard error` con "Volver a conectar" |
| `customers/data_request` | DropFlex no guarda datos de clientes: se registra en `webhook_events` y se responde 200 (hay que documentarlo en la política de privacidad) |
| `customers/redact` | Igual: no hay datos de clientes que borrar; se registra |
| `shop/redact` (48 h después de desinstalar) | Borra `catalog_items`, `shopify_connections` y el secreto de Vault de esa tienda |
| `products/update`, `products/delete` | **Opcional, fase posterior.** Mantiene `catalog_items` al día |

Todos se declaran en `shopify.app.toml`, así que no hay registro manual.

### 5.6 Desconectar

Hoy la UI dice "Puedes desconectar en cualquier momento desde Ajustes o desde tu Shopify", pero no existe la acción.

- Nueva ruta `DELETE /api/onboarding/shopify`: revoca el token si la Admin API lo permite (verificar la mutación vigente), borra el secreto, pone `status='revoked'` y devuelve el `snapshot`.
- En la UI, un `Button size="sm"` dentro de `actions` de la `ConnectionCard` de Ajustes › Conexiones. Es un componente existente y no cambia el diseño.
- Queda sujeto a la decisión D5, porque el diseño actual no dibuja esa acción.

---

## 6. Meta

### 6.1 App y permisos

- **Facebook Login for Business** con una *configuración* creada en el panel de la app (`META_LOGIN_CONFIG_ID`), de tipo token de acceso de usuario. Así se cierra la falla 17.
- **Permisos**, derivados de `PERMS_META`:
  - `ads_read`: rendimiento de campañas y del píxel.
  - `ads_management`: campañas, anuncios y presupuestos que tú apruebes.
  - `business_management`: listar cuentas y activos del Business Manager ("Encontramos varias en tu Business Manager").
  - `pages_show_list`: listar las páginas en O7.
  - `pages_read_engagement`: **solo si** se mantiene "Instagram vinculado" en la página (campo `instagram_business_account`). Si no, se quita del texto. Decisión D6.
- **No** se piden `pages_manage_posts` ni ningún permiso de publicación en páginas. Eso respeta "Nunca: publicar en tu página sin tu aprobación" y achica la revisión de app.
- `META_GRAPH_VERSION` en env. Hay que verificar la versión estable vigente en el changelog de Meta: `v21.0` del base probablemente ya no está vigente.
- Se exige la revisión de app (Advanced Access) de cada permiso y la verificación del negocio.

### 6.2 Inicio: `POST /api/onboarding/meta/connect`

- Mismo contrato: `{ authorizeUrl }` y 409 si Shopify no está conectada.
- Sesión obligatoria.
- Nonce en la cookie `df_oauth_meta`; `state` `{purpose:"meta", uid, nonce, iat}`.
- URL: `https://www.facebook.com/<ver>/dialog/oauth?client_id&redirect_uri&state&response_type=code&config_id=<META_LOGIN_CONFIG_ID>&override_default_response_type=true`.
  - Si `meta_connections` ya existía (reconexión), se agrega `auth_type=rerequest`.
- Upsert de `meta_connections` con `status='connecting'`.

### 6.3 Callback: `GET /api/onboarding/meta/callback`

1. `?error` o `error_reason=user_denied` → `denied`, que ya se mapea a "Cancelaste la autorización en Facebook…".
2. `validateState`: firma, `purpose`, TTL, cookie y `uid`. Se borra la cookie siempre.
3. Canje de `code` → token corto, y luego `fb_exchange_token` → token largo (~60 días). Es el mismo par de llamadas del base, con timeout. Un error 5xx de Meta da `unavailable`, no `denied` ni re-auth.
4. `GET /debug_token?input_token=<token>&access_token=<app_id>|<app_secret>` para leer `expires_at`, `data_access_expires_at`, `scopes` y `user_id`. Faltan permisos requeridos → `insufficient_scope`.
5. `set_integration_token('meta', uid, token)`: **un solo** secreto por comerciante, no uno por cuenta publicitaria.
6. `status='action'`, que coincide con `ConnectionCard state="action"` ("Falta un paso").
7. Redirige a `/onboarding/meta/accounts`; si hubo error, a `/onboarding/meta`. Es la misma lógica que hoy.

**Nada de copiar campañas aquí** (falla 14).

### 6.4 Activos: `GET /api/onboarding/meta/assets` (O7)

Toda llamada lleva `appsecret_proof = HMAC-SHA256(token, META_APP_SECRET)` y se pagina completa, con un tope defensivo de 20 páginas como en el base.

| Lista | Llamada | Mapeo a `Option` |
|---|---|---|
| Cuentas publicitarias | `/me/adaccounts?fields=id,name,account_status,disable_reason,currency,business{name}` | `meta` = "`<moneda>` · activa"; con `account_status != 1` → `disabled:true`, `tone:"danger"` y el motivo en texto (§7) |
| Páginas | `/me/accounts?fields=id,name,instagram_business_account` | `meta` = "Instagram vinculado" si aplica (D6) |
| Píxeles | `/<act>/adspixels?fields=id,name,last_fired_time` | Sin disparos en 7 días → `tone:"warning"`, aviso que no bloquea |

**Sugerencia:**
- cuenta: la primera activa con `currency` igual a la moneda de la tienda; si no hay, la primera activa;
- página: la única, o la primera;
- píxel: el que disparó más recientemente.

**Ajuste de contrato (el único).** Los píxeles dependen de la cuenta. Hoy `MetaAssets.pixels` es una lista plana, así que se agrega un campo sin quitar nada:

```ts
interface MetaAssets {
  adAccounts: Option[]; pages: Option[]; pixels: Option[];      // pixels = los de la cuenta sugerida (compatibilidad)
  pixelsByAccount: Record<string, Option[]>;                    // nuevo
  suggested: { account: string; page: string; pixel: string };
}
```

`MetaCuentasStep` cambia `options={assets.pixels}` por `assets.pixelsByAccount[account] ?? []` y reinicia `pixel` al cambiar de cuenta. Sigue siendo el mismo `OptionList`, sin cambio visual.

Si no hay ninguna cuenta activa, `ConnectionCard action` con el texto de §7 y "Conectar después" sigue disponible.

### 6.5 Guardar: `POST /api/onboarding/meta/assets`

- Mismo contrato: `{ account, page, pixel }` → `{ snapshot }`.
- **Se valida en el servidor** que cada id esté en lo que devuelve Graph *con el token del usuario* y que la cuenta no esté deshabilitada. Para no llamar dos veces, se reutiliza una caché corta de 10 min en memoria por usuario o en una columna `assets_cache jsonb`.
- Guarda los ids **y los nombres** (el base no guardaba el nombre), con `status='connected'` y `finishedAt`.
- `Connections` en Ajustes ya muestra `account · pixel`, ahora con los nombres reales.

`POST /api/onboarding/meta/skip` no cambia: `meta_connections` queda sin fila, u `onboarding.finished_at` con Meta pendiente.

### 6.6 Ciclo de vida

- **Vencimiento:** `GET /api/cron/connections` (con `Authorization: Bearer CRON_SECRET` comparado con `timingSafeEqual`, cada día).
  - Para cada `meta_connections` `connected`, llama a `debug_token`.
  - Si `is_valid=false` o `expires_at` está a menos de 7 días, pone `status='error'` y `error_code='expired'`.
  - `SetupSlot` y `Connections` ya pintan `ConnectionCard error` con "Volver a conectar", que es el estado "Permiso de Meta vencido" del diseño.
  - No se intenta refrescar (falla 15).
- **Error 190 o 102** en cualquier llamada → `status='error'` en el acto. 4, 17, 32, 613 o `is_transient` → reintento con backoff y **sin** cambio de estado. 100 → error de parámetros (no NotFound). 403 sin código de auth → permiso, no re-auth.
- **Desautorización:** `POST /api/webhooks/meta/deauthorize` parsea `signed_request` (HMAC-SHA256 con `META_APP_SECRET`, `timingSafeEqual`), busca por `fb_user_id`, borra el token y pone `status='revoked'`.
- **Borrado de datos:** `POST /api/webhooks/meta/data-deletion`, con el mismo `signed_request`. La página de estado quedó en `/auth/data-deletion/<código>`, que ya es pública.
  - Borra `meta_connections` y el token, y crea `data_deletion_requests`.
  - Responde `{ url: "<APP_URL>/data-deletion/<code>", confirmation_code }`, como exige Meta.
  - Esa página de estado es texto simple en v2, con los componentes del design system.
- **Desconectar:** `DELETE /api/onboarding/meta` → `DELETE /me/permissions`, borra el secreto y deja el estado en `later`. Misma nota de UI que en §5.6 (decisión D5).

---

## 7. Errores: clave → texto

`error_code` se guarda como clave. El texto se arma en `snapshot()` con la voz del design system (tuteo, qué pasó y qué hacer, sin signos de exclamación). Los marcados con † ya existen en v2; los demás son nuevos y hay que revisarlos con `design:ux-copy` antes de cerrarlos.

| Clave | Shopify | Meta |
|---|---|---|
| `denied` † | Cancelaste la autorización en Shopify. Vuelve a intentarlo cuando quieras. | Cancelaste la autorización en Facebook. Puedes conectarla ahora o después. |
| `expired` † | La autorización venció. Vuelve a conectar tu tienda. | La autorización venció. Vuelve a conectar Meta Ads. |
| `insufficient_scope` | Faltan permisos para leer tus productos y pedidos. Vuelve a conectar y acepta todos. | Faltan permisos para ver tus cuentas publicitarias. Vuelve a conectar y acepta todos. |
| `shop_taken` | Esa tienda ya está conectada a otra cuenta de DropFlex. Entra con esa cuenta o escríbenos. | — |
| `not_found` † | No encontramos esa tienda. Revisa la dirección. | — |
| `unavailable` | Shopify no respondió. Intenta de nuevo en unos minutos. | Facebook no respondió. Intenta de nuevo en unos minutos. |
| `revoked` | Desinstalaste DropFlex en Shopify. Vuelve a conectar para seguir. | Quitaste el acceso de DropFlex en Facebook. Vuelve a conectar para anunciar. |
| `no_ad_accounts` | — | No encontramos cuentas publicitarias activas en tu Business Manager. Activa una en Meta o conecta después. |
| `import_failed` | No pudimos traer todos tus productos. Reintentaremos solos; si sigue, vuelve a conectar. | — |
| Motivo de cuenta deshabilitada | — | "Deshabilitada por Meta" †, "Pago pendiente", "En revisión", "Cerrada" (según `account_status`) |

---

## 8. Variables de entorno (v2)

```bash
# Supabase (ya existen)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # nuevo: solo servidor

INTEGRATIONS_MODE=live                # live | simulation (dev y check:onboarding)
APP_URL=https://app.dropflex…         # base de redirect_uri y de los callbacks
OAUTH_STATE_SECRET=                   # ≥ 32 caracteres
CRON_SECRET=

SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
SHOPIFY_API_VERSION=                  # trimestral (AAAA-01|04|07|10); verifica la estable vigente

META_APP_ID=
META_APP_SECRET=
META_LOGIN_CONFIG_ID=
META_GRAPH_VERSION=                   # verifica la estable vigente
```

`redirect_uri` se deriva de `APP_URL` (`/api/onboarding/shopify/callback` y `/api/onboarding/meta/callback`), no del header `Host` como hacía el base con los webhooks.

---

## 9. Decisiones que necesito de ti

| # | Decisión | Recomendación |
|---|---|---|
| **D1** | Tocar `proxy.ts`/auth: rutas públicas que se autentican solas, cliente `service_role` y "volver a" después del login | **Decidido (2026-09-23): sí, los tres.** El cliente admin está en `lib/integrations/admin.ts`; el proxy responde 401 JSON en `/api/*` y el login lleva `?next=` |
| **D2** | ~~Instalación: legacy o administrada~~ | **Decidido (2026-09-23): instalación administrada** (§5.1, §5.2). Queda por definir si v2 usa una app nueva o la actual (ver F0) |
| **D3** | Tiendas con moneda distinta de CLP | **Decidido: se acepta cualquier moneda.** `catalog_items` guarda `numeric(14,2)` en la moneda de la tienda; `money(value, currency)` y los campos de O5 usan su símbolo y sus decimales; los sugeridos de O5 fuera de CLP son proporcionales a la mediana de precios |
| **D4** | ¿Se mantiene la simulación? | **Decidido: se elimina.** Sin `/simulation/*`, sin catálogo falso ni cuenta simulada; `check:onboarding` usa un usuario de prueba con una tienda de desarrollo ya conectada. La generación con IA sigue simulada (fuera de alcance) |
| **D5** | "Desconectar" en Ajustes | **Decidido: sí**, con `Button size="sm" variant="ghost"` en `ConnectionCard actions` (`components/onboarding/disconnect-button.tsx`) |
| **D6** | "Instagram vinculado" en O7 | **Decidido: se quita** esa línea y no se pide `pages_read_engagement` |
| **D7** | Tasa de entrega calculada desde pedidos (Paso 3) | Otra spec; mientras tanto, valor sugerido sin destello |

---

## 10. Plan por fases

Cada fase termina con `npm run build && npm run lint && npm run typecheck && npm run check:valores`. Las que tocan UI, además con `check:onboarding` en modo `simulation`.

**F0 · Preparación (fuera del código)**
- **App de Shopify.** Recomiendo una **app nueva para v2** (por ejemplo "DropFlex" de producción más una de desarrollo) en lugar de modificar la actual.
  - La del base sigue en uso con alcances de temas y *legacy install flow*. Cambiarle alcances o modo mientras `dropflex` sigue en producción afecta a las tiendas ya instaladas.
  - Si prefieres reutilizarla: al desplegar el toml de v2 se reemplazan sus alcances (se van los de temas y entran `read_inventory` y `read_orders`) y se desactiva legacy. Las tiendas instaladas tendrán que aceptar los alcances nuevos.
- **Dos configuraciones, dos apps:** `shopify.app.toml` (producción) y `shopify.app.dev.toml` (desarrollo). Se crean con `shopify app config link`, se eligen con `shopify app config use` o `--config dev`, y se despliegan por separado (`shopify app deploy --config dev`).
  - La app de desarrollo se instala solo en **tiendas de desarrollo**, desde su enlace de instalación, sin revisión del App Store. Ahí se prueba la instalación administrada completa antes de tocar producción.
  - La documentación de Shopify no dice explícitamente cómo se comporta la instalación administrada en una app **no embebida**. La app de desarrollo es donde se confirma, y es criterio de salida de F2.
  - Sus URLs apuntan a un túnel HTTPS fijo (por ejemplo cloudflared con dominio propio) o a un preview estable de Vercel. No se usa `automatically_update_urls_on_dev`, porque la cookie del nonce depende del dominio y un túnel que cambia rompe el callback.
- Desplegar con `shopify app deploy` y confirmar en el Dev Dashboard que *Use legacy install flow* quedó desactivado en ambas apps.
- Solicitar el acceso a *Protected customer data* por `read_orders`.
- App de Meta de tipo Business, con la configuración de FLfB, las URLs válidas de OAuth, la URL de desautorización y la de borrado de datos.
- Proyecto Supabase con Vault habilitado.
- Resolver D1 y D3–D6.

**F1 · Base**
- Migraciones de §4, `lib/integrations/{env,oauth-state,tokens,admin}.ts` y vitest.
- Se portan y adaptan los tests de `oauth.test.ts` (state y normalización).
- `store.ts` pasa a leer y escribir en Supabase; la cookie se queda solo en modo `simulation`.
- Las rutas de onboarding exigen sesión.

**F2 · Conectar Shopify**
- `shopify/oauth.ts`, `shopify/client.ts` y las rutas `connect`, `callback` e `install` (lanzamiento de la instalación administrada, §5.2).
- Se portan `oauth.test.ts` (HMAC) y `client.test.ts`.
- Criterio: instalar desde el enlace de instalación con sesión abierta lleva a O3 `connected` **sin** pantallas de permisos de DropFlex ni formulario; sin sesión pasa por crear la cuenta y retoma solo; O2 → Shopify → O3 también funciona; cancelar muestra `error` con "Reintentar"; una tienda ajena da `shop_taken`.

**F3 · Importación y catálogo**
- `import.ts`, `catalog.ts`, el lease, ventas de 30 días y `GET /shopify/products` desde `catalog_items`.
- La generación simulada deja de usar `findProduct` de `catalog.ts` y lee nombres e imágenes de `catalog_items`.
- Se porta `import.test.ts`.
- Criterio: una tienda con más de 120 productos muestra la barra avanzando en O3; O4 lista productos reales con 3 recomendados marcados; una tienda vacía muestra el estado vacío.

**F4 · Webhooks de Shopify**
- `/api/webhooks/shopify` con los 4 topics, deduplicación y `webhook.test.ts`.
- Criterio: `shopify app webhook trigger` de cada topic; desinstalar deja `ConnectionCard error` en Ajustes.

**F5 · Conectar Meta**
- `meta/oauth.ts`, `meta/client.ts`, `meta/assets.ts` y las rutas `connect`, `callback` y `assets`.
- El ajuste de `pixelsByAccount`.
- Criterio: con un usuario de prueba, O6 → Facebook → O7 lista cuentas reales (una deshabilitada con motivo); guardar lleva a O8, y Ajustes muestra la cuenta y el píxel.

**F6 · Ciclo de vida de Meta**
- `signed-request.ts`, desautorización, borrado de datos con página de estado y el cron de vencimiento.
- Desconectar en ambos proveedores (si se aprueba D5).
- Tests de `signed_request` y de la clasificación de errores.

**F7 · Cierre**
- `/simulation/*` y `catalog.ts` quedan solo en `simulation`.
- `DELETE /api/onboarding/state` deshabilitado en producción.
- Actualizar `docs/onboarding-backend.md` ("En producción") y `CLAUDE.md` (sección Onboarding).
- `ProviderMark` → logos oficiales según las guías de marca de cada proveedor, como pide `design-system/onboarding.md`. Es un cambio de UI que dicta el propio design system, en una tarea aparte.

---

## 11. Riesgos

- **Revisión de apps.** Tanto Shopify (datos protegidos de clientes, requisitos de app pública) como Meta (Advanced Access, verificación del negocio) pueden tardar semanas. Mientras tanto, solo funcionan tiendas de desarrollo y usuarios de prueba.
- **Timeouts en serverless.** La importación por tramos y el lease acotan cada invocación. Si los catálogos son muy grandes, pasar a una cola.
- **Cambios de API.** Las versiones de Shopify y Graph van en env; hay que revisarlas cada trimestre.
- **`cacheComponents`.** Las páginas del onboarding ya leen dentro de `<Suspense>`. Al leer de Supabase dependen de las cookies de sesión, así que se mantiene ese patrón.
