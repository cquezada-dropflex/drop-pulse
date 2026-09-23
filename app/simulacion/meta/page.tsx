import type { Metadata } from "next";
import { Suspense } from "react";
import { PERMS_META } from "@/components/onboarding/permissions";
import { SimulatedConsent } from "@/components/onboarding/simulated-consent";

export const metadata: Metadata = { title: "Autorizar (simulación)" };

async function Consent({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state = "" } = await searchParams;
  const back = (result: string) => `/api/onboarding/meta/callback?${new URLSearchParams({ state, result })}`;
  return (
    <SimulatedConsent
      provider="meta"
      name="Facebook"
      account="Business Manager: Mi Tienda"
      permissions={PERMS_META}
      approveHref={back("ok")}
      cancelHref={back("cancel")}
    />
  );
}

export default function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  return (
    <Suspense>
      <Consent searchParams={searchParams} />
    </Suspense>
  );
}
