import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { StepSkeleton } from "@/components/onboarding/skeleton";
import { guardStep } from "@/lib/onboarding/guard";
import { ShopifyStep } from "@/components/onboarding/steps/shopify";
import { PENDING_SHOP_COOKIE } from "@/lib/integrations/shopify/start";

export const metadata: Metadata = { title: "Conecta tu tienda" };

async function Step() {
  await guardStep("shopify");
  // Tienda que llegó desde Shopify: la dirección viene puesta.
  const pending = (await cookies()).get(PENDING_SHOP_COOKIE)?.value;
  return <ShopifyStep pendingShop={pending} />;
}

export default function Page() {
  return (
    <Suspense fallback={<StepSkeleton />}>
      <Step />
    </Suspense>
  );
}
