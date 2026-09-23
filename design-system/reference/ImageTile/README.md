# ImageTile

Una opción de imagen que se elige, ordena o descarta con un toque.

- **Qué provees:** `src`, `alt`, `state` (`idle` | `selected` | `discarded` | `generating` | `error`) y `order` cuando está elegida.
- Elegir asigna el siguiente número; la número 1 lleva la etiqueta “Portada”. Mantener presionado reordena (arrastre), en escritorio se arrastra directamente.
- Descartar apaga la imagen (escala de grises, 35%) y deja “Recuperar”; no desaparece hasta salir de la pantalla.
- Siempre en grilla de 3 columnas en móvil (`df-grid3`), 5–6 en escritorio.
