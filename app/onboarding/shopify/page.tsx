import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { ShopifyStep } from "@/components/onboarding/steps/shopify";

export const metadata: Metadata = { title: "Conecta tu tienda" };

async function Step() {
  await guardStep("shopify");
  return <ShopifyStep />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
