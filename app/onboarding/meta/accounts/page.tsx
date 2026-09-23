import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { MetaCuentasStep } from "@/components/onboarding/steps/meta";
import { metaAssets } from "@/lib/onboarding/service";

export const metadata: Metadata = { title: "Elige dónde anunciar" };

async function Step() {
  await guardStep("meta-cuentas");
  return <MetaCuentasStep assets={metaAssets()} />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
