import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { ProductosStep } from "@/components/onboarding/steps/productos";
import { productLists } from "@/lib/onboarding/service";

export const metadata: Metadata = { title: "Elige con qué empezar" };

async function Step() {
  const { state, now } = await guardStep("productos");
  return <ProductosStep initial={productLists(state, now)} />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
