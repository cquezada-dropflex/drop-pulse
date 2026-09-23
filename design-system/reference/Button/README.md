# Button

Dispara una acción; `primary` marca la única acción principal de la vista.

- **Qué provees:** `variant` (`primary` | `secondary` | `ghost` | `destructive`), `size` (`sm` | `md` | `lg`), `icon` / `iconEnd` (nombre de `Icon`), `loading`, `disabled`, `block`, `kbd` (atajo visible en escritorio) y el texto como `children`.
- **Estados:** reposo, hover (`primary-hover` / `accent`), presionado (escala 0,98), foco (anillo `ring` de 2px con separación de 2px), deshabilitado (`muted` + `muted-foreground`), cargando (spinner + `aria-busy`).
- Un solo `primary` por pantalla; en móvil vive en la barra fija inferior, al alcance del pulgar, en tamaño `lg`.
- Verbo al inicio, en infinitivo o imperativo con tuteo: “Aceptar”, “Continuar: Imágenes”, “Subir a $15.000”. Sin signos de exclamación.
- `destructive` solo para lo que cuesta dinero o no se deshace (Apagar campaña). Descartar contenido NO es destructivo: se deshace con `Toast`.
- Altura mínima táctil `size-touch` (44px) en `md` y `lg`; `sm` solo dentro de filas en escritorio o dentro de `AttentionItem`.
