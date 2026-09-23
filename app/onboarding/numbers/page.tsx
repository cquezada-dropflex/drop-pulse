import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { NumerosStep } from "@/components/onboarding/steps/numeros";
import { CATALOG, findProduct } from "@/lib/onboarding/catalog";
import { suggestedNumbers } from "@/lib/onboarding/service";

const pick = (p: { name: string; price: number; cost: number }) => ({ name: p.name, price: p.price, cost: p.cost });

export const metadata: Metadata = { title: "Tus números" };

async function Step() {
  const { state } = await guardStep("numeros");
  return <NumerosStep suggested={suggestedNumbers()} example={pick(findProduct(state.selected?.[0] ?? "") ?? CATALOG[0])} />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
