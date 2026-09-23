# PermissionList

Explica en lenguaje simple qué lee, qué escribe y qué nunca hace DropFlex con una cuenta conectada.

- **Qué provees:** `title`, `items` (`{ kind: 'read' | 'write' | 'never', text }`), `note`.
- Va siempre antes del botón que abre la autorización del proveedor: la confianza se gana antes del salto, no después.
- "Escribe" usa `primary-soft` porque es la línea que más importa leer. Cada línea de "Escribe" termina en "que tú apruebes".
- Nunca listes permisos técnicos (scopes). Esos van en la documentación, no en la UI.
