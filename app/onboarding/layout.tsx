import type { Metadata } from "next";
import { Suspense } from "react";
import { OnboardingProvider } from "@/components/onboarding/provider";
import { OnboardingSide } from "@/components/onboarding/side";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { readOnboarding } from "@/lib/onboarding/store";
import { snapshot } from "@/lib/onboarding/service";

export const metadata: Metadata = { title: { default: "Configura tu cuenta", template: "%s · DropFlex" } };

async function Shell({ children }: { children: React.ReactNode }) {
  const initial = snapshot((await readOnboarding()).state, Date.now());
  return (
    <OnboardingProvider initial={initial}>
      <div className="lg:flex">
        <OnboardingSide />
        <main id="contenido" className="flex min-h-svh min-w-0 flex-1 flex-col">
          {children}
        </main>
      </div>
    </OnboardingProvider>
  );
}

/** Onboarding: sin pestañas. Móvil, un paso por pantalla; escritorio, pasos a la izquierda. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
