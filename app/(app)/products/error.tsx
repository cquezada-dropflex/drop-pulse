"use client";

import { RouteError } from "@/components/shell/route-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="No pudimos cargar tus productos"
      description="Puede ser tu conexión. Ningún producto cambió de estado; reintenta en un momento."
    />
  );
}
