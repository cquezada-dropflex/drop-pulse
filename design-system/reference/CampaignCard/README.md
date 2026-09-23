# CampaignCard

Una campaña con su veredicto (qué hacer), la razón en una frase y las cifras que lo justifican.

- **Qué provees:** `name`, `imageIndex`/imagen, `verdict` (`subir` | `seguir` | `vigilar` | `apagar` | `aprendiendo`), `reason`, `metrics` (lista de `Metric`), `nextBudget`, `paused`, `actions` (por defecto según veredicto; `null` para ninguna).
- Orden fijo: veredicto → razón con cifras → métricas → acción. El comerciante no interpreta tablas: lee la recomendación y la verifica.
- `subir` ofrece “Subir a $X” (`primary`); `apagar` ofrece “Apagar” (`destructive`) y “Mantener”. `aprendiendo` pide esperar y dice cuánto.
- La razón siempre compara contra el límite que definió el comerciante (CPA máximo), nunca contra un promedio abstracto.
