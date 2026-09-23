import { Suspense } from "react";
import { RootRedirect } from "@/components/shell/auth-gate";

// `/` no tiene contenido propio: redirige a Hoy con sesión y a iniciar sesión sin ella.
export default function Home() {
  return (
    <Suspense fallback={null}>
      <RootRedirect />
    </Suspense>
  );
}
