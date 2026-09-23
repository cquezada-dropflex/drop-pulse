"use client";

import { Icon } from "./icon";
import { Thumb } from "./thumb";
import { cn } from "@/lib/utils";

export interface PickRowProps {
  name: string;
  image?: string;
  /** Precio y ventas: “$24.990 · 41 ventas en 30 días”. */
  meta?: string;
  /** Hasta 2 problemas concretos: “Sin descripción”, “2 imágenes”. */
  issues?: string[];
  /** Potencial de mejora. */
  score?: "Alta" | "Media" | "Baja" | string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

/** Fila con casilla para elegir productos importados, con lo que la IA puede mejorar. */
export function PickRow({ name, image, meta, issues, score, checked, onCheckedChange, disabled }: PickRowProps) {
  return (
    <label
      className={cn(
        "relative flex items-center gap-3 px-4 py-3 not-first:border-t",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        checked ? "bg-primary-soft" : "bg-card",
      )}
    >
      <input
        type="checkbox"
        checked={checked ?? false}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        data-focus="within"
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
          checked
            ? "bg-primary text-primary-foreground"
            : "bg-background text-transparent inset-ring-(length:--stroke-strong) inset-ring-input",
        )}
      >
        <Icon name="check" size="sm" strokeWidth={2.5} />
      </span>
      <Thumb src={image} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-row">{name}</span>
        {meta ? <span className="text-caption text-muted-foreground">{meta}</span> : null}
        {issues?.length ? (
          <span className="mt-1 flex flex-wrap gap-1">
            {issues.map((t) => (
              <span key={t} className="rounded-sm bg-warning-soft px-1.5 py-px text-micro text-warning">
                {t}
              </span>
            ))}
          </span>
        ) : null}
      </span>
      {score != null ? (
        <span className="flex flex-col items-end" title="Potencial de mejora">
          <span className="sr-only">Potencial de mejora:</span>
          <b className="text-label font-semibold">{score}</b>
          <small aria-hidden className="text-tab font-normal text-muted-foreground">
            mejora
          </small>
        </span>
      ) : null}
    </label>
  );
}
