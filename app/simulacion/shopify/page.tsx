import type { Metadata } from "next";
import { Suspense } from "react";
import { PERMS_SHOPIFY } from "@/components/onboarding/permissions";
import { SimulatedConsent } from "@/components/onboarding/simulated-consent";

export const metadata: Metadata = { title: "Autorizar (simulación)" };

async function Consent({ searchParams }: { searchParams: Promise<{ shop?: string; state?: string }> }) {
  const { shop = "", state = "" } = await searchParams;
  const back = (result: string) => `/api/onboarding/shopify/callback?${new URLSearchParams({ shop, state, result })}`;
  return (
    <SimulatedConsent
      provider="shopify"
      name="Shopify"
      account={shop}
      permissions={PERMS_SHOPIFY}
      approveHref={back("ok")}
      cancelHref={back("cancel")}
    />
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ shop?: string; state?: string }> }) {
  return (
    <Suspense>
      <Consent searchParams={searchParams} />
    </Suspense>
  );
}
