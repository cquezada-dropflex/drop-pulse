"use client";

import { RouteError } from "@/components/shell/route-error";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="No pudimos cargar tus campañas"
      description="Puede ser tu conexión o Meta Ads. Tus campañas siguen activas; reintenta en un momento."
    />
  );
}
