# ConnectionCard

Estado de una integración (Shopify o Meta Ads) con lo que pasa y qué hacer.

| state | Chip | Uso |
|---|---|---|
| `idle` | ninguno | Aún no se conecta |
| `connecting` | Conectando (gira) | Esperando la autorización del proveedor |
| `importing` | Importando (gira) + barra | Trayendo productos. Con `progress` (0 a 1) y `detail` |
| `connected` | Conectada (verde) | Con `account` y, opcional, `facts` |
| `action` | Falta un paso (ámbar) | Autorizó, pero falta elegir cuenta, página o píxel |
| `error` | Sin conexión (rojo) | Borde `destructive`; `detail` dice qué pasó y `actions` cómo arreglarlo |
| `later` | Pendiente (contorno) | El usuario eligió "Conectar después" |

- **Qué provees:** `provider` (`shopify` | `meta`), `state`, `account`, `detail`, `progress`, `facts` (`[etiqueta, valor]`), `actions`.
- `ProviderMark` es un ícono genérico. **En producción, usa el logo oficial de cada proveedor** según sus guías de marca; este sistema no dibuja marcas de terceros.
- Se usa también en Ajustes › Conexiones, con los mismos estados.
