# Field

Campo de entrada, pensado para cifras de dinero.

- **Qué provees:** `label`, `value`, `prefix` (`$`) o `suffix` (`%`), `hint`, `error`, `disabled`, `ai` (el valor lo estimó la IA: ícono destello en la ayuda).
- Texto a 16px para que el teléfono no haga zoom al enfocar; teclado numérico con `inputMode`.
- Borde `input` (≥3:1); foco con borde `primary` y halo `primary-soft`; error con borde y mensaje `destructive` que dice cómo arreglarlo.
