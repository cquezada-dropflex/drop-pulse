"use client";

import { useEffect } from "react";
import { Button, Icon } from "@/components/df";

/** Error de una ruta: qué pasó y cómo seguir. Nunca “Algo salió mal”. */
export function RouteError({
  error,
  reset,
  title,
  description = "Puede ser tu conexión. Tus decisiones anteriores están guardadas.",
  backHref = "/hoy",
  backLabel = "Ir a Hoy",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="mb-1 grid size-12 place-items-center rounded-full bg-destructive-soft text-destructive">
        <Icon name="alert" />
      </span>
      <h1 className="text-heading">{title}</h1>
      <p className="max-w-sm text-body text-muted-foreground">{description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button variant="primary" icon="undo" onClick={reset}>
          Reintentar
        </Button>
        <Button href={backHref} variant="ghost">
          {backLabel}
        </Button>
      </div>
      {error.digest ? <p className="font-mono text-code text-muted-foreground">Código {error.digest}</p> : null}
    </div>
  );
}
