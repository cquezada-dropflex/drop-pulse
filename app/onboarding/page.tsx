import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { readOnboarding } from "@/lib/onboarding/store";
import { STEP_PATH, pendingStep } from "@/lib/onboarding/service";

async function ToPending(): Promise<never> {
  redirect(STEP_PATH[pendingStep(await readOnboarding())]);
}

/** `/onboarding` retoma el paso pendiente: cada paso se guarda al completarse. */
export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <ToPending />
    </Suspense>
  );
}
