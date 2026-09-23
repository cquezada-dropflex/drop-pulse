# AssistantSheet

Asistente que responde sobre el producto sin sacarte de lo que estás viendo.

- **Qué provees:** `variant` (`sheet` en móvil | `panel` en escritorio), `context` (qué está mirando: “Corrector de postura · Precio”), `messages` (`{ from: 'user'|'ai', text, apply }`), `suggestions`.
- Móvil: hoja inferior al 60% de la altura, sobre `scrim`; la pantalla de atrás sigue visible arriba. Escritorio: panel derecho de 340px, sin tapar el trabajo.
- El chip de contexto dice sobre qué responde; cambia solo al navegar.
- Cuando la respuesta propone un cambio, trae un botón `apply` que lo crea como propuesta (entra al ciclo como `generado`, nunca se aplica directo).
