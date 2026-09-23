"use client";

import { RouteError } from "@/components/shell/route-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="No pudimos cargar tus ajustes"
      description="Puede ser tu conexión. Tus supuestos guardados siguen igual; reintenta en un momento."
    />
  );
}
