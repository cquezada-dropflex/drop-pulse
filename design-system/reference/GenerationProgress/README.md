# GenerationProgress

Avance de la IA generando contenido para los productos elegidos.

- **Qué provees:** `items` (`{ name, imageIndex, status, detail }`, con `status` = `generado` | `publicando` (se muestra como "Generando") | `cola` | `error`), `eta`, `title`, `compact` (solo encabezado y barra), `action`.
- Versión `compact` en los pasos que siguen a "Empezar a generar", para que el usuario vea que avanza mientras conecta Meta.
- Con el primer producto `generado`, la pantalla final ofrece revisarlo sin esperar al resto.
- Un producto con error no detiene a los demás; su `detail` dice qué pasó.
