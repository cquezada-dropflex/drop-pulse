import type { Metadata } from "next";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { ProductosStep } from "@/components/onboarding/steps/productos";
import { productLists } from "@/lib/onboarding/service";
import { loadCatalog } from "@/lib/onboarding/catalog";

export const metadata: Metadata = { title: "Elige con qué empezar" };

async function Step() {
  const { state } = await guardStep("productos");
  return <ProductosStep initial={productLists(await loadCatalog(state.userId), state.shop?.total ?? 0)} />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
