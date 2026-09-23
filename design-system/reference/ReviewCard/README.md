# ReviewCard

Compara el contenido original con la propuesta de la IA y decide: descartar, editar o aceptar.

- **Qué provees:** `field`, `original` (puede faltar si no había), `proposal`, `index`/`total`, `state` (`pending` | `editing` | `accepted` | `discarded`), `keys` (muestra atajos A / D / E en escritorio), `hideActions` cuando las acciones viven en la barra fija.
- Móvil: original arriba en `muted` y tono apagado; propuesta abajo con borde `foreground`, porque es lo que decides. Escritorio: lado a lado.
- Al aceptar o descartar, avanza sola a la siguiente propuesta (`duration-base`, `ease-exit`) y muestra `Toast` con “Deshacer”. Sin confirmaciones.
- Editar convierte la propuesta en un área de texto con borde `primary`; “Guardar y aceptar” es una sola acción.
- Orden de botones fijo: Descartar · Editar · Aceptar (el principal, a la derecha, bajo el pulgar).
