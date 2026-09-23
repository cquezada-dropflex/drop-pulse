"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onboardingApi } from "@/lib/onboarding/client";
import type { OnboardingSnapshot } from "@/lib/onboarding/types";

interface Ctx {
  snapshot: OnboardingSnapshot;
  setSnapshot: (s: OnboardingSnapshot) => void;
  refresh: () => Promise<void>;
}

const OnboardingCtx = createContext<Ctx | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingCtx);
  if (!ctx) throw new Error("useOnboarding fuera de OnboardingProvider");
  return ctx;
}

/** ¿Hay algo avanzando en segundo plano (importación o generación)? */
export function isBusy(s: OnboardingSnapshot) {
  const importing = s.shop?.status === "importing";
  const generating = Boolean(s.generation && s.generation.items.some((i) => i.status === "publicando" || i.status === "cola"));
  return importing || generating;
}

/**
 * Estado del onboarding en el cliente. Parte del snapshot del servidor y consulta
 * GET /api/onboarding/state cada 1,5 s mientras se importa o se genera.
 */
export function OnboardingProvider({ initial, children }: { initial: OnboardingSnapshot; children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState(initial);
  const refresh = useCallback(async () => {
    try {
      setSnapshot(await onboardingApi.state());
    } catch {
      // Sin conexión: se reintenta en el próximo ciclo.
    }
  }, []);
  const busy = isBusy(snapshot);

  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(refresh, 1500);
    return () => window.clearInterval(t);
  }, [busy, refresh]);

  return <OnboardingCtx.Provider value={{ snapshot, setSnapshot, refresh }}>{children}</OnboardingCtx.Provider>;
}
