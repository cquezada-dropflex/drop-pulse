"use client";

import { RouteError } from "@/components/shell/route-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="No pudimos cargar lo que te toca hoy"
      description="Puede ser tu conexión. Tus productos y campañas siguen igual; reintenta en un momento."
      backHref="/productos"
      backLabel="Ver productos"
    />
  );
}
