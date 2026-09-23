# ProductRow

Una fila de la lista de productos: miniatura, nombre, avance y el motivo por el que está donde está.

- **Qué provees:** `name`, `image` (o `imageIndex` en demos), `stages` (para `StageMeter`), `reason` (una frase: qué pasa y desde cuándo) y `tone` (`warning` detenido o esperando, `danger` error, `success` publicado, `primary` en curso, `muted`).
- El motivo es obligatorio cuando el producto no avanza: “Detenido: falta el precio · 3 días”. Nunca “Pendiente” a secas.
- Agrupa filas dentro de un contenedor `df-group` (borde `border`, radio `radius-lg`); las filas se separan con una línea, no con aire.
- Toda la fila es el objetivo táctil y lleva al producto en la etapa que lo detiene.
