# StageMeter

Resume en una línea el avance de un producto: una rayita por etapa.

- **Qué provees:** `stages`, lista de `done` | `current` | `review` | `stuck` | `error` | `locked` | `optional`.
- `done` en `foreground`, `current` en `primary`, `review`/`stuck` en `warning`, `error` en `destructive`, `locked` vacía, `optional` solo contorno.
- Se lee en menos de un segundo en la lista de productos; siempre acompáñalo del motivo en texto (lo hace `ProductRow`).
