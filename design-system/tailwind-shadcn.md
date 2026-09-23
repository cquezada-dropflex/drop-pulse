# Tokens en Tailwind y shadcn/ui

Los tokens de color usan los mismos nombres que shadcn/ui, así que los componentes de shadcn toman el tema de DropFlex sin tocarlos. El archivo listo para pegar está en `export/globals.css` (Tailwind CSS v4); `export/components.json` es un ejemplo de configuración de shadcn.

## Instalación

1. `npx shadcn@latest init` en tu proyecto Next.js con Tailwind v4.
2. Reemplaza el contenido de `app/globals.css` por `export/globals.css`.
3. Modo oscuro: agrega la clase `dark` a `<html>` (por ejemplo con `next-themes`, `attribute="class"`). También funciona `data-theme="dark"`.

## Qué trae

- `:root` y `.dark` con todas las variables de color (`--background`, `--primary`, `--muted-foreground`, `--success`, `--warning-soft`, `--chart-1`…`--chart-5`, `--sidebar-*`), elevación, espaciado, duraciones, medidas y z-index.
- `@theme inline` que expone cada color como utilidad: `bg-primary`, `text-muted-foreground`, `bg-success-soft text-success`, `border-input`, `ring-ring`.
- Radios derivados de `--radius` (10px) como en shadcn: `rounded-sm` 6px, `rounded-md` 10px, `rounded-lg` 14px.
- Escala tipográfica como utilidades: `text-title`, `text-heading`, `text-body`, `text-label`, `text-caption`, `text-metric`, `text-metric-lg`.
- Geist y Geist Mono como `font-sans` y `font-mono`; cifras tabulares en `body`.

## Correspondencias

| DropFlex | Tailwind | Uso |
|---|---|---|
| `primary` / `primary-foreground` | `bg-primary text-primary-foreground` | Botón principal (`<Button>` por defecto de shadcn) |
| `primary-soft` | `bg-primary-soft text-primary` | Selección, pestaña activa |
| `secondary` | `bg-secondary` | Controles segmentados |
| `accent` | `hover:bg-accent` | Hover neutro (no es el acento de marca) |
| `success` / `-soft` | `bg-success-soft text-success` | Aprobado, publicado, ganancia |
| `warning` / `-soft` | `bg-warning-soft text-warning` | En revisión, detenido |
| `destructive` / `-soft` | `bg-destructive-soft text-destructive` | Error, pérdida, apagar |
| `input` | `border-input` | Borde de campos (≥3:1) |
| `ring` | `ring-ring` / `outline-ring` | Foco |

## Ejemplo

```tsx
<span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 h-6 text-label text-warning">
  <Eye className="size-3.5" /> En revisión
</span>

<Button className="w-full h-12 text-base">Continuar: Imágenes</Button>

<p className="text-metric-lg text-success tabular-nums">$8.590</p>
```

Para íconos en React, `lucide-react` es el reemplazo más cercano a los íconos de trazo del sistema (misma grilla de 24px y trazo redondeado); usa `strokeWidth={1.75}`.
