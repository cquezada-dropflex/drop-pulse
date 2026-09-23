import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { MetaCuentasStep } from "@/components/onboarding/steps/meta";
import { loadMetaAssets } from "@/lib/integrations/meta/select";
import { OnboardingError, type MetaAssets } from "@/lib/onboarding/types";

export const metadata: Metadata = { title: "Elige dónde anunciar" };

async function Step() {
  const { state } = await guardStep("meta-cuentas");
  let assets: MetaAssets;
  try {
    assets = await loadMetaAssets(state.userId, state.shop?.currency ?? null);
  } catch (e) {
    // Token vencido, sin permisos o sin cuentas activas: el Paso 4 muestra el error y cómo seguir.
    if (e instanceof OnboardingError) redirect("/onboarding/meta");
    throw e;
  }
  return <MetaCuentasStep assets={assets} />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
