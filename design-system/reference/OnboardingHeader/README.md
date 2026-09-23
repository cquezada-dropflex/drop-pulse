# OnboardingHeader

Encabezado de cada paso del onboarding: volver, "Paso N de 4", avance, título y por qué se pide.

- **Qué provees:** `step`, `total`, `optionalSteps` (los pasos que se pueden saltar se dibujan solo con contorno), `back` (texto accesible del botón volver; se omite en el paso 1), `skip` (texto del atajo para saltar, por ejemplo "Usar sugeridos"), `title`, `desc`.
- La descripción siempre dice **para qué** se pide el dato, no qué es. Ejemplo: "Con esto calculamos cuánto ganas por venta".
- Reemplaza a `TopBar` y a `Navigation`: durante el onboarding no hay pestañas.
