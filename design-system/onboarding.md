# Onboarding

El onboarding tiene un solo objetivo: que el comerciante **revise su primer producto mejorado en menos de 5 minutos**. Todo lo que no sirve para eso se pide después o se infiere.

## Flujo

```
O1 Crear cuenta
   └─ Paso 1  Conectar Shopify ........ obligatorio (de aquí salen los productos)
        │     └─ importación en segundo plano
        ├─ Paso 2  Elegir productos ... 3 recomendados, ya marcados
        ├─ Paso 3  Tus números ........ valores sugeridos; "Usar sugeridos" lo salta
        │     └─ "Empezar a generar" → la IA empieza aquí
        ├─ Paso 4  Conectar Meta Ads .. opcional; ocurre MIENTRAS la IA genera
        │     └─ Elegir cuenta publicitaria, página y píxel
        └─ Listo → "Revisar <primer producto>"  (o "Ir a Hoy")
                    └─ Hoy muestra SetupChecklist si algo quedó pendiente
```

## Decisiones y por qué

### 1. Shopify primero, y es el único paso obligatorio
Sin productos no hay nada que mejorar. Meta Ads solo se usa en la etapa opcional de Anuncios, así que exigirla al inicio frenaría a quien aún no anuncia.

### 2. La importación no bloquea
Al volver de Shopify, los productos se importan en segundo plano (`ConnectionCard` en estado `importing`) y el usuario sigue avanzando. Los recomendados se calculan con lo que ya llegó.

### 3. Elegir productos antes que configurar
Ver sus propios productos, con lo que la IA puede mejorar ("Sin descripción", "2 imágenes"), es el momento en que el comerciante entiende el valor. Por eso va antes de los números. Los 3 recomendados vienen marcados: el camino rápido es un solo toque.

### 4. Los números vienen llenos
La tasa de entrega se calcula con los pedidos de Shopify (se marca con el destello); el envío y el CPA máximo traen valores sugeridos editables. "Usar sugeridos" permite saltar el paso. Un ejemplo con su propio producto muestra para qué sirven: "A $24.990 ganarías $8.590 por venta".

### 5. Meta Ads se conecta mientras la IA trabaja
La generación tarda unos minutos. En vez de una pantalla de espera, ese tiempo se usa para conectar Meta, con el avance visible arriba (`GenerationProgress` compacto). Si lo salta ("Conectar después"), no pierde nada: queda en `SetupChecklist`.

### 6. La confianza se gana antes del salto
Antes de cada autorización externa, `PermissionList` dice en lenguaje simple qué lee, qué escribe (siempre "lo que tú apruebes") y qué nunca hace. Nada se publica en la tienda ni en Meta sin aprobación: es la misma promesa de toda la app.

### 7. Terminar en trabajo real, no en un tablero vacío
La pantalla final lleva directo a revisar el primer producto generado, aunque los demás sigan en proceso. El usuario aprende el ciclo propuesta → aprobación haciéndolo.

### 8. Se puede retomar
Cada paso se guarda al completarse. Si cierra la app, al volver entra al paso pendiente. Después de conectar Shopify, cualquier salida lleva a Hoy con `SetupChecklist`.

## Estados que el diseño cubre

| Momento | Estado | Qué ve el usuario |
|---|---|---|
| Dirección de tienda mal escrita | `Field` con error | "No encontramos esa tienda. Revisa la dirección." |
| Canceló la autorización en Shopify | `ConnectionCard` `error` | Qué pasó y "Volver a intentar" |
| Importando | `ConnectionCard` `importing` | Barra y "86 de 128 productos" |
| Tienda sin productos | Estado vacío en Paso 2 | "Tu tienda no tiene productos aún" + enlace para importar desde el proveedor |
| Varias cuentas publicitarias | `OptionList` | La sugerida marcada; las deshabilitadas con su motivo |
| Píxel sin eventos | `OptionList` `warning` | Aviso que no bloquea |
| Permiso de Meta vencido (después) | `ConnectionCard` `error` en Hoy y Ajustes | "Volver a conectar" |
| Un producto no se pudo generar | `GenerationProgress` fila `error` | Los demás siguen |

## Móvil y escritorio

- **Móvil:** una pantalla por paso, `OnboardingHeader` arriba (sin pestañas) y la acción principal en la barra fija inferior. Los pasos se pueden saltar solo cuando son opcionales.
- **Escritorio (≥1024px):** columna izquierda de 232px con los pasos (`StageList`) y el estado de lo conectado o de la generación; contenido al centro con ancho máximo `size-content`; pie fijo con el resumen y las acciones a la derecha.

## Textos

- Títulos como acción o resultado: "Conecta tu tienda Shopify", "Elige con qué empezar", "Tu primer producto está listo".
- La descripción de cada paso dice para qué se pide el dato.
- Botones con el resultado: "Mejorar 3 productos", "Empezar a generar", "Guardar y terminar". Nunca "Siguiente" a secas.
- Nombra al proveedor en el botón que lleva a él: "Conectar con Shopify", "Continuar con Facebook".

## Notas para implementar

- **Marcas:** `ProviderMark` es genérico. Usa los logos y botones oficiales de Shopify, Meta y Google según sus guías de marca.
- **Shopify:** OAuth de app con alcances de lectura de productos, inventario y pedidos, y escritura de productos. Revisa en la documentación vigente de Shopify los alcances exactos y el modelo de instalación recomendado para apps públicas (instalación administrada desde el App Store): en ese caso el Paso 1 empieza desde Shopify y el campo de dirección queda como alternativa.
- **Meta:** Facebook Login for Business con permisos de gestión y lectura de anuncios, de Business Manager y de páginas. Verifica en la documentación vigente de Meta los nombres de los permisos y la revisión de app que exigen.
- **Tokens:** guarda los tokens de acceso cifrados en el servidor, nunca en el cliente; maneja su vencimiento con el estado `error` de `ConnectionCard`.
