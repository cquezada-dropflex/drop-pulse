import { Suspense } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { AssistantProvider } from "@/components/shell/assistant-provider";
import { AuthGate } from "@/components/shell/auth-gate";
import { getTodaySummary } from "@/lib/data/today";

// Grupo protegido por la sesión de Supabase (proxy.ts + AuthGate).
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const summary = await getTodaySummary();
  return (
    <AssistantProvider>
      <AppShell badges={{ hoy: summary.pending }}>{children}</AppShell>
      <Suspense fallback={null}>
        <AuthGate />
      </Suspense>
    </AssistantProvider>
  );
}
