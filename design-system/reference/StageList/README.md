# StageList

La ruta de un producto: etapas en orden, con dependencias y opcionales, para retomar donde quedó.

- **Qué provees:** `stages`: `{ title, state, desc, optional, end }`. `state`: `done` | `current` | `review` | `available` | `locked` | `error`.
- `locked` explica en `desc` de qué depende (“Necesita textos, imágenes y precio aprobados”) y no navega.
- `current` es la etapa que abre el botón fijo “Continuar: <etapa>”; se resalta con `primary-soft`.
- `review` y `error` pintan su descripción en `warning` / `destructive` para que el motivo se lea sin entrar.
- Las opcionales llevan la etiqueta “Opcional” y nunca bloquean “Publicar”.
- En escritorio se muestra como columna izquierda fija del producto.
