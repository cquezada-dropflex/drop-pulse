# Arquitectura y navegación

La estructura sale de los siete casos de uso, no de las pantallas de una app típica. Una pregunta ordena todo: **¿qué tiene que decidir el comerciante ahora?**

## Mapa

```
Hoy  ─────────── cola de decisiones (todas las pantallas desembocan aquí)
│
Productos ────── lista filtrable: Avanzan · Detenidos · Publicados
│   └─ Producto ── ruta de etapas + "Continuar"
│        ├─ Textos ........ revisión propuesta por propuesta
│        ├─ Imágenes ...... elegir, ordenar, descartar
│        ├─ Precio y oferta  calculadora + vista del comprador
│        ├─ Publicar en tu tienda
│        └─ Anuncios (opcional) ─→ enlaza a la campaña
│
Campañas ─────── tarjetas con veredicto: Sube · Déjala · Vigílala · Apágala
    └─ Campaña ── cifras, historial, presupuesto

Asistente ────── hoja sobre cualquier pantalla, con el contexto actual
Ajustes ──────── supuestos (tasa de entrega, CPA máximo), tienda, cuentas
```

## Decisiones y por qué

### 1. Tres pestañas: Hoy, Productos, Campañas

- **Hoy es el inicio**, no un panel de métricas. El usuario abre la app entre otras tareas; lo primero que ve es la lista de decisiones pendientes, ordenada por impacto (errores y dinero primero, revisión después, lo detenido al final). Resuelve el caso 1 (dónde estoy parado) y es la puerta rápida a los casos 3 y 6.
- **Productos** es el inventario y el lugar para retomar (caso 2). El filtro Avanzan · Detenidos · Publicados responde “cuáles avanzan, cuáles están detenidos” con un toque, y cada fila dice *por qué* está detenida.
- **Campañas** está al mismo nivel porque vigilar anuncios es un hábito diario que no depende de un producto concreto (caso 6), y porque es donde se gasta dinero.
- Tres destinos caben con etiqueta completa y buen tamaño táctil en una barra inferior. Más pestañas diluirían la señal; menos obligarían a esconder campañas dentro de productos.

### 2. El producto es una ruta, no un formulario

- El proceso es largo, con dependencias y opcionales. Mostrarlo como lista vertical de etapas (`StageList`) deja ver de un vistazo qué está hecho, qué espera y qué depende de qué: una etapa bloqueada dice qué la desbloquea.
- Un único botón fijo **“Continuar: <etapa>”** lleva a lo siguiente pendiente. El comerciante no tiene que recordar dónde quedó (caso 2).
- Las etapas son pantallas propias, no pestañas dentro del producto: en móvil cada una necesita todo el ancho y su propia barra de acción.
- Las opcionales (anuncios, video) nunca bloquean “Publicar”.

### 3. Revisión como flujo de una propuesta a la vez

- Se revisa muchas veces por producto (caso 3), así que el costo por decisión debe tender a cero: una propuesta en pantalla, original arriba y apagado, propuesta abajo y marcada, tres acciones fijas bajo el pulgar.
- Aceptar o descartar avanza solo a la siguiente; “Deshacer” en un toast reemplaza las confirmaciones.
- En escritorio se ve lado a lado con atajos (A, D, E) y la lista de lo que sigue.

### 4. Imágenes: tocar es elegir, el número es el orden

- Una grilla de 3 columnas y un solo gesto (tocar) para elegir; el número que aparece es la posición en la tienda y el 1 es la portada (caso 4). Reordenar es mantener presionado. Descartar no borra: apaga y deja “Recuperar”.

### 5. Precio: la ganancia primero, la vitrina al lado

- La pregunta real es “¿cuánto gano?”, así que esa cifra encabeza y se recalcula mientras escribe. El desglose muestra en qué se va el resto, y la vista del comprador confirma cómo se verá la oferta (caso 5).
- Los supuestos (tasa de entrega, CPA estimado) se declaran debajo y se cambian en Ajustes, para que las cifras sean honestas sin llenar la pantalla de campos.

### 6. Campañas: veredicto, razón, cifras, acción

- El comerciante no es analista: cada campaña empieza por lo que debe hacer, sigue con una frase que cita la cifra y su límite, y recién después las métricas para verificar (caso 6).
- “Aún aprendiendo” evita decisiones prematuras y dice cuánto esperar.

### 7. El asistente es una capa, no un destino

- Pedir consejo no debe sacarlo de lo que ve (caso 7). En móvil el asistente se abre como hoja inferior al 60% sobre la pantalla actual; en escritorio, como panel derecho.
- Siempre dice sobre qué responde (chip de contexto), y lo que propone entra al ciclo como `generado`, nunca se aplica directo.
- Se abre con el destello de la barra superior de cada pantalla de producto: mismo lugar, mismo ícono.

## De móvil a escritorio

| Móvil (< 1024px) | Escritorio (≥ 1024px) |
|---|---|
| Barra inferior de 3 pestañas | Riel lateral con las mismas 3 + Ajustes al pie |
| Producto: ruta → pantalla de etapa | Producto: ruta fija a la izquierda + etapa al centro |
| Revisión apilada (original sobre propuesta) | Revisión lado a lado con atajos de teclado |
| Asistente como hoja inferior sobre la pantalla | Asistente como panel derecho de 340px |
| Campañas en una columna | Campañas en dos columnas, cuatro métricas por tarjeta |
| Acción principal en barra fija inferior | Acción principal alineada a la derecha del bloque |

Entre 768 y 1023px (tableta) se mantiene la navegación móvil con listas a dos columnas.
