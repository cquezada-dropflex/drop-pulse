# Backend del onboarding (maqueta)

El onboarding de `design-system/onboarding.md` funciona de punta a punta contra una **maqueta del backend**: las rutas y los contratos son los que tendrá la API real, pero Shopify, Meta, la IA y la base de datos están simulados.

| Pieza | Maqueta | En producción |
|---|---|---|
| Estado del onboarding | Cookie `df_onboarding` (httpOnly, 30 días) | Tabla `onboarding` en Supabase, una fila por comerciante |
| Crear cuenta (O1) | `POST /api/onboarding/cuenta` si no hay Supabase configurado | Supabase Auth (`/auth/sign-up`, ya conectado) |
| Autorizar Shopify | Página `/simulacion/shopify` + callback | OAuth de app de Shopify (o instalación administrada desde el App Store) |
| Importar productos | Progreso calculado por tiempo: 128 productos en 24 s | Admin API de Shopify (GraphQL, paginado) en un job |
| Recomendados | Ventas × potencial de mejora sobre `lib/onboarding/catalog.ts` | Mismo criterio sobre pedidos reales de 30 días |
| Generación de la IA | Por tiempo: 1.º producto a los 8 s, luego cada 18 s; “Masajeador de cuello” falla a propósito | Cola de jobs de generación |
| Autorizar Meta | Página `/simulacion/meta` + callback | Facebook Login for Business |
| Cuentas, páginas y píxeles | Lista fija con una sugerida, una deshabilitada y un píxel sin eventos | Marketing API de Meta |

El código está en `lib/onboarding/`:

- `types.ts`: estado persistido, snapshot y DTOs.
- `service.ts`: la lógica como **funciones puras** (estado + hora → estado nuevo o derivado). Es lo único que hay que reemplazar.
- `store.ts`: lectura y escritura del estado (hoy, la cookie).
- `http.ts`: respuesta de error uniforme `{ error, field }` y el patrón leer → cambiar → guardar → responder con el snapshot.
- `client.ts`: cliente tipado para los componentes del navegador.
- `guard.ts`: en cada página, si el paso no corresponde, redirige al pendiente.

## Rutas

Todas responden JSON. Los errores traen `{ error, field? }` con un mensaje en español que dice qué pasó y qué hacer.

| Método y ruta | Cuerpo | Respuesta | Errores |
|---|---|---|---|
| `GET /api/onboarding/state` | — | `OnboardingSnapshot` (paso pendiente, importación, generación, Meta) | — |
| `DELETE /api/onboarding/state` | — | 204 (reinicia la maqueta) | — |
| `POST /api/onboarding/cuenta` | `{ email }` | `{ snapshot }` | 400 `email` |
| `POST /api/onboarding/shopify/conectar` | `{ shop }` (“mitienda”, dominio o URL) | `{ authorizeUrl }` | 400 `shop` (vacío o con caracteres inválidos), 404 `shop` (“No encontramos esa tienda”) |
| `GET /api/onboarding/shopify/callback` | `?shop&state&result` | 307 → `/onboarding/shopify` | Nonce distinto o cancelado → estado `error` en la ConnectionCard |
| `GET /api/onboarding/shopify/productos` | — | `{ recommended, all, total, defaultSelection }` con lo ya importado | — |
| `POST /api/onboarding/productos` | `{ ids }` | `{ snapshot }` | 400 `ids` (ninguno, o más que el límite del plan: 10) |
| `GET /api/onboarding/numeros` | — | `{ suggested, source }` | — |
| `POST /api/onboarding/numeros` | `{ deliveredOf10, shipping, maxCpa }` o `{ sugeridos: true }` | `{ snapshot }` y **empieza la generación** | 400 por campo, 409 si no hay productos elegidos |
| `GET /api/onboarding/generacion` | — | `GenerationStatus` | 404 si aún no empieza |
| `POST /api/onboarding/meta/conectar` | — | `{ authorizeUrl }` | 409 si Shopify no está conectada |
| `GET /api/onboarding/meta/callback` | `?state&result` | 307 → `/onboarding/meta/cuentas` o `/onboarding/meta` | Cancelado → `error` |
| `GET /api/onboarding/meta/activos` | — | `MetaAssets` (cuentas, páginas, píxeles y sugerencia) | — |
| `POST /api/onboarding/meta/activos` | `{ account, page, pixel }` | `{ snapshot }`, termina el onboarding | 400 si una opción no existe o está deshabilitada, 409 sin autorizar |
| `POST /api/onboarding/meta/despues` | — | `{ snapshot }`, termina el onboarding con Meta pendiente | 409 sin números |
| `POST /api/onboarding/checklist` | `{ hidden }` | `{ snapshot }` | — |

## Pantallas y estados

| Ruta | Pantalla | Qué cubre |
|---|---|---|
| `/auth/crear-cuenta` | O1 | Google (maqueta) y correo; con Supabase configurado, pasa a `/auth/sign-up` con el correo precargado (por `sessionStorage`, no por la URL) |
| `/onboarding` | — | Retoma el paso pendiente |
| `/onboarding/shopify` | O2 / O3 | Formulario; dirección mal escrita (error en el campo); autorización cancelada (ConnectionCard `error` con “Cambiar dirección” y “Reintentar”); importando con barra; conectada |
| `/onboarding/productos` | O4 | Recomendados (12) y Todos (128), 3 preelegidos, límite del plan, lista que crece mientras se importa, tienda sin productos |
| `/onboarding/numeros` | O5 | Valores sugeridos (entrega con destello), “Usar sugeridos”, ejemplo de ganancia en vivo con el primer producto |
| `/onboarding/meta` | O6 | Generación compacta avanzando, permisos, “Continuar con Facebook” y “Conectar después” |
| `/onboarding/meta/cuentas` | O7 | Cuenta sugerida, una deshabilitada con motivo, píxel con aviso que no bloquea |
| `/onboarding/listo` | O8 | Primer producto listo (o esperando), generación completa, conexiones, “Revisar <producto>” e “Ir a Hoy” |
| `/hoy` | O9 | `SetupChecklist` si Meta quedó pendiente; la x la oculta y reaparece en Ajustes › Conexiones |
| `/simulacion/shopify`, `/simulacion/meta` | — | Autorización simulada, marcada como tal, sin marcas de terceros |

## Probar

```bash
npm run dev
npm run check:onboarding   # recorre O1–O9 con errores, 390 y 1280px, claro y oscuro, con axe en cada pantalla
```

En el navegador: `/auth/crear-cuenta`. Para empezar de nuevo, `DELETE /api/onboarding/state` o borra la cookie `df_onboarding`. Para ver el error de tienda, escribe `noexiste` en la dirección.

## Para pasar a producción

1. **Estado:** reemplaza `store.ts` por una tabla `onboarding (user_id pk, state jsonb, updated_at)` con RLS `user_id = auth.uid()`; las funciones de `service.ts` no cambian.
2. **Shopify:** en `startShopify`, arma la URL de autorización real (alcances de lectura de productos, inventario y pedidos, y escritura de productos; revisa en la documentación vigente de Shopify los alcances exactos y el modelo de instalación recomendado). En el callback valida el HMAC y el `state`, canjea el código por el token y guárdalo **cifrado en el servidor**. `importStatus` pasa a leer el avance del job de importación.
3. **Meta:** Facebook Login for Business con los permisos de gestión y lectura de anuncios, Business Manager y páginas (verifica los nombres vigentes y la revisión de app). `metaAssets` consulta la Marketing API; un token vencido se muestra como `ConnectionCard` `error` en Hoy y Ajustes.
4. **Generación:** `saveNumbers` encola un job por producto; `generationStatus` lee su estado.
5. **Marcas:** `ProviderMark` es genérico. Usa los logos y botones oficiales de Shopify, Meta y Google según sus guías de marca, y elimina `/simulacion/*`.
