import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { readOnboarding } from "@/lib/onboarding/store";
import { STEP_PATH, pendingStep } from "@/lib/onboarding/service";
import { PENDING_SHOP_COOKIE } from "@/lib/integrations/shopify/start";

async function ToPending(): Promise<never> {
  const { state } = await readOnboarding();
  const step = pendingStep(state);
  // Llegó desde Shopify antes de iniciar sesión: se retoma esa instalación.
  if (step === "shopify" && (await cookies()).get(PENDING_SHOP_COOKIE)) redirect("/api/onboarding/shopify/resume");
  // Quien ya terminó entra a su trabajo, no a la pantalla final del onboarding.
  if (step === "listo" && state.finishedAt) redirect("/today");
  redirect(STEP_PATH[step]);
}

/** `/onboarding` retoma el paso pendiente: cada paso se guarda al completarse. */
export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <ToPending />
    </Suspense>
  );
}
