import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { MetaStep } from "@/components/onboarding/steps/meta";

export const metadata: Metadata = { title: "Conecta Meta Ads" };

async function Step() {
  await guardStep("meta");
  return <MetaStep />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
