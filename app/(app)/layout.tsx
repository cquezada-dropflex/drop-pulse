import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantProvider } from "@/components/shell/assistant-provider";
import { AuthGate } from "@/components/shell/auth-gate";
import { getNavBadges } from "@/lib/data/today";

// Grupo protegido por la sesión de Supabase (proxy.ts + AuthGate).
export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Sin await: el número de Hoy se resuelve dentro de un Suspense de la navegación.
  const badges = getNavBadges().catch(() => ({}));
  return (
    <AssistantProvider>
      <AppShell badges={badges}>{children}</AppShell>
      <Suspense fallback={null}>
        <AuthGate />
      </Suspense>
    </AssistantProvider>
  );
}
