# PriceBreakdown

Muestra cuánto ganas por venta y en qué se va el resto del precio.

- **Qué provees:** `price` y `parts` (`{ label, value }` en orden: costo del producto, envío, publicidad por venta…), `note` con los supuestos.
- La cifra que decide va primero y grande (`type-metric-lg`): en `success` si ganas, en `destructive` con signo menos si pierdes.
- La barra usa grises (`chart-1`…`chart-3`) para los costos y color solo para la ganancia (`chart-4`), para que lo que te queda se lea primero.
- Se recalcula en vivo al cambiar cualquier `Field` de precio.
