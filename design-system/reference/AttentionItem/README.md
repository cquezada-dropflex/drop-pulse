# AttentionItem

Una decisión pendiente en la pantalla Hoy, con la acción para resolverla ahí mismo.

- **Qué provees:** `kind` (`error` | `ads` | `ads-up` | `review` | `stuck`), `title` (qué hay que hacer, en imperativo o como hecho), `product` (dónde), `detail` (la cifra o razón que lo justifica) y `actions` (0–2 `Button` `sm`).
- Orden en Hoy: primero lo que cuesta dinero o bloquea ventas (errores de publicación, campañas a apagar), después lo que espera revisión, al final lo detenido.
- Una acción `primary` como máximo por ítem, y solo en el primer grupo.
