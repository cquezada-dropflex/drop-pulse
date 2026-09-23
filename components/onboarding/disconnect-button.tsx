"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, notify } from "@/components/df";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";

/** Ajustes › Conexiones · “Desconectar” (spec D5). Sin diálogo: la conexión se recupera volviendo a conectar. */
export function DisconnectButton({ provider }: { provider: "shopify" | "meta" }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    setBusy(true);
    try {
      await (provider === "shopify" ? onboardingApi.disconnectShopify() : onboardingApi.disconnectMeta());
      notify(provider === "shopify" ? "Desconectamos tu tienda. Puedes volver a conectarla cuando quieras." : "Desconectamos Meta Ads. Puedes volver a conectarla cuando quieras.");
      router.refresh();
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "No pudimos desconectar. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Button size="sm" variant="ghost" loading={busy} onClick={run}>
      Desconectar
    </Button>
  );
}
