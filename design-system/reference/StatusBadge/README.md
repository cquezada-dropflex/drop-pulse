# StatusBadge

Muestra en qué punto del ciclo de vida está un contenido: color, ícono y palabra, siempre los tres.

| status | Palabra | Ícono | Tono |
|---|---|---|---|
| `generado` | Generado | destello | neutro (`muted`) — la IA lo creó, nadie lo ha visto |
| `revision` | En revisión | ojo | `warning-soft` / `warning` — espera tu decisión |
| `aprobado` | Aprobado | check | `success-soft` / `success` |
| `rechazado` | Rechazado | x | contorno `border`, texto `muted-foreground` — se aparta de la vista |
| `publicando` | Publicándose | arco que gira | neutro con movimiento (único estado animado) |
| `publicado` | Publicado | check en círculo | relleno `success` — el único chip sólido |
| `error` | Con error | triángulo | `destructive-soft` / `destructive` |

- **Qué provees:** `status`, `size="sm"` en filas densas, `label` para cambiar la palabra sin cambiar el significado.
- El color nunca va solo: el ícono distingue aprobado de publicado y de error para quien no distingue verde y rojo.
- Nunca uses `primary` para un estado: el azul significa “puedes tocar esto”.
