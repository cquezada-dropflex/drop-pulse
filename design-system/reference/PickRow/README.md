# PickRow

Fila con casilla para elegir productos importados, con lo que la IA puede mejorar.

- **Qué provees:** `name`, `imageIndex`/imagen, `meta` (precio y ventas), `issues` (hasta 2 problemas detectados, en ámbar), `score` (potencial de mejora: Alta, Media o Baja), `checked`.
- Seleccionada: fondo `primary-soft` y casilla `primary`.
- Los problemas son concretos y verificables: "Sin descripción", "2 imágenes", "Título de proveedor". Nunca un puntaje sin explicación.
- La lista "Recomendados" ordena por ventas × potencial y preselecciona los 3 primeros.
