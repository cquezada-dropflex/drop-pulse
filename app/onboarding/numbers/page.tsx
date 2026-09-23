import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { NumerosStep } from "@/components/onboarding/steps/numeros";
import { suggestedNumbers } from "@/lib/onboarding/service";
import { catalogByIds, catalogPrices } from "@/lib/onboarding/catalog";

export const metadata: Metadata = { title: "Tus números" };

async function Step() {
  const { state } = await guardStep("numeros");
  const currency = state.shop?.currency || "CLP";
  const first = state.selected[0];
  const [prices, picked] = await Promise.all([catalogPrices(state.userId), catalogByIds(state.userId, first ? [first] : [])]);
  const p = first ? picked.get(first) : undefined;
  return (
    <NumerosStep
      suggested={suggestedNumbers(currency, prices)}
      currency={currency}
      example={{ name: p?.name ?? "producto", price: p?.price ?? 0, cost: p?.cost ?? 0 }}
    />
  );
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
