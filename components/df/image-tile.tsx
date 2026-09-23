"use client";

import Image from "next/image";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export type ImageTileState = "idle" | "selected" | "discarded" | "generating" | "error";

export interface ImageTileProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  src?: string;
  alt?: string;
  state?: ImageTileState;
  /** Posición en la tienda cuando está elegida. La 1 es la portada. */
  order?: number;
  /** Tocar: elegir / quitar de las elegidas / recuperar (si está descartada) / reintentar (si falló). */
  onSelect?: () => void;
}

const tileBase = "relative block aspect-square w-full overflow-hidden rounded-md bg-muted p-0";

/** Una opción de imagen que se elige, ordena o descarta con un toque. */
export function ImageTile({ src, alt = "Imagen", state = "idle", order, onSelect, className, ...rest }: ImageTileProps) {
  if (state === "generating") {
    return (
      <div
        role="status"
        className={cn(
          tileBase,
          "grid place-items-center text-muted-foreground after:absolute after:inset-0 after:animate-df-shimmer after:bg-linear-100 after:from-transparent after:from-30% after:via-background after:via-50% after:to-transparent after:to-70% after:opacity-60",
          className,
        )}
      >
        <span className="relative z-1 flex flex-col items-center gap-1 text-micro font-medium">
          <Icon name="sparkle" />
          Generando
        </span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={`${alt}: no se pudo generar. Reintentar`}
        className={cn(tileBase, "grid cursor-pointer place-items-center bg-destructive-soft text-destructive", className)}
        {...rest}
      >
        <span className="flex flex-col items-center gap-1 text-micro font-medium">
          <Icon name="alert" />
          Reintentar
        </span>
      </button>
    );
  }

  const selected = state === "selected";
  const discarded = state === "discarded";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={discarded ? undefined : selected}
      aria-label={`${alt}${selected ? `, posición ${order}${order === 1 ? ", portada" : ""}` : discarded ? ", descartada. Recuperar" : ", sin elegir"}`}
      className={cn(
        tileBase,
        "cursor-pointer transition-shadow duration-base ease-standard",
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
      {...rest}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1024px) 20vw, 33vw"
          draggable={false}
          className={cn(
            "object-cover transition-opacity duration-base ease-standard",
            discarded && "opacity-35 grayscale",
          )}
        />
      ) : null}
      {selected ? (
        <span className="absolute top-1.5 left-1.5 grid h-6 min-w-6 place-items-center rounded-full bg-primary px-1.5 text-caption font-semibold text-primary-foreground">
          {order}
        </span>
      ) : discarded ? null : (
        <span
          aria-hidden
          className="absolute top-1.5 left-1.5 size-6 rounded-full bg-background/85 inset-ring-(length:--stroke-strong) inset-ring-muted-foreground"
        />
      )}
      {selected && order === 1 ? (
        <span className="absolute bottom-1.5 left-1.5 rounded-sm bg-foreground px-1.5 py-0.5 text-micro font-semibold text-background">
          Portada
        </span>
      ) : null}
      {discarded ? (
        <span className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-center gap-1 rounded-sm bg-card px-1.5 py-0.5 text-micro font-medium text-foreground">
          <Icon name="undo" size="sm" />
          Recuperar
        </span>
      ) : null}
    </button>
  );
}
