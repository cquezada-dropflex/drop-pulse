# OptionList

Lista de opciones con radio para elegir una sola cuenta publicitaria, página o píxel.

- **Qué provees:** `label`, `hint`, `name`, `value`, `options` (`{ value, title, meta, tone: 'warning' | 'danger', disabled, tag }`).
- Preselecciona la opción sugerida y márcala con `tag: 'Sugerida'`. Si hay una sola opción, igual se muestra, ya elegida.
- Las opciones que no se pueden usar se muestran deshabilitadas con el motivo en `meta` y `tone: 'danger'`, en vez de esconderlas.
- Un aviso que no bloquea (por ejemplo, un píxel sin eventos) va en `meta` con `tone: 'warning'`.
- Toda la fila es el objetivo táctil (≥56px). El radio real queda oculto pero accesible, con foco visible.
