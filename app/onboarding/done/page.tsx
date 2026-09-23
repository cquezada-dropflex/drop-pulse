import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { ListoStep } from "@/components/onboarding/steps/listo";

export const metadata: Metadata = { title: "Listo" };

async function Step() {
  await guardStep("listo");
  return <ListoStep />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
