"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ConnectionCard, GenerationProgress, OptionList, PermissionList, notify } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import { ApiError, onboardingApi } from "@/lib/onboarding/client";
import type { MetaAssets } from "@/lib/onboarding/types";
import { PERMS_META } from "../permissions";
import { useOnboarding } from "../provider";
import { OnboardingScreen } from "../screen";

const HEADER = { step: 4, total: 4, optionalSteps: [4], back: "Volver" };

/** Avance de la IA en versión compacta (en escritorio lo muestra la columna izquierda). */
function CompactProgress() {
  const { snapshot } = useOnboarding();
  if (!snapshot.generation) return null;
  return (
    <div className="rounded-lg border bg-card p-4 lg:hidden">
      <GenerationProgress compact items={snapshot.generation.items} eta={snapshot.generation.eta} />
    </div>
  );
}

/** Paso 4 (opcional): Meta Ads se conecta mientras la IA trabaja. */
export function MetaStep() {
  const router = useRouter();
  const { snapshot, setSnapshot } = useOnboarding();
  const [busy, setBusy] = useState<"connect" | "later" | null>(null);
  const meta = snapshot.meta;

  const connect = async () => {
    setBusy("connect");
    try {
      const { authorizeUrl } = await onboardingApi.connectMeta();
      window.location.assign(authorizeUrl);
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "No pudimos abrir Facebook. Intenta de nuevo.");
      setBusy(null);
    }
  };
  const later = async () => {
    setBusy("later");
    try {
      const { snapshot: next } = await onboardingApi.skipMeta();
      setSnapshot(next);
      router.push("/onboarding/done");
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "No pudimos guardar. Intenta de nuevo.");
      setBusy(null);
    }
  };

  return (
    <OnboardingScreen
      header={{ ...HEADER, backHref: "/onboarding/numbers" }}
      title="Conecta Meta Ads"
      desc="Para crear anuncios con tus productos y decirte cuáles funcionan. Si no los usas aún, sáltalo."
      bodyClassName="gap-4"
      footer={
        <StickyActions variant="bar" stack="reverse" summary="Si lo saltas, no pierdes nada: queda en tu lista de Hoy.">
          <Button variant="ghost" block loading={busy === "later"} onClick={later} className="lg:w-auto">
            Conectar después
          </Button>
          <Button variant="primary" size="lg" block loading={busy === "connect"} onClick={connect} className="lg:h-control lg:w-auto lg:text-row">
            Continuar con Facebook
          </Button>
        </StickyActions>
      }
    >
      <CompactProgress />
      <ConnectionCard
        provider="meta"
        state={meta?.status === "error" ? "error" : "idle"}
        account="Cuenta publicitaria, página y píxel"
        detail={meta?.status === "error" ? meta.error : undefined}
        className="lg:max-w-content"
      />
      <PermissionList title="Qué hará DropFlex con Meta" items={PERMS_META} className="lg:max-w-content" />
    </OnboardingScreen>
  );
}

/** Elegir cuenta publicitaria, página y píxel. La sugerida viene marcada. */
export function MetaCuentasStep({ assets }: { assets: MetaAssets }) {
  const router = useRouter();
  const { setSnapshot } = useOnboarding();
  const [account, setAccount] = useState(assets.suggested.account);
  const [page, setPage] = useState(assets.suggested.page);
  const [pixel, setPixel] = useState(assets.suggested.pixel);
  const [busy, setBusy] = useState<"save" | "later" | null>(null);

  const save = async () => {
    setBusy("save");
    try {
      const { snapshot } = await onboardingApi.saveMetaAssets({ account, page, pixel });
      setSnapshot(snapshot);
      router.push("/onboarding/done");
    } catch (e) {
      notify(e instanceof ApiError ? e.message : "No pudimos guardar. Intenta de nuevo.");
      setBusy(null);
    }
  };
  const later = async () => {
    setBusy("later");
    try {
      const { snapshot } = await onboardingApi.skipMeta();
      setSnapshot(snapshot);
      router.push("/onboarding/done");
    } catch {
      setBusy(null);
    }
  };

  return (
    <OnboardingScreen
      header={{ ...HEADER, backHref: "/onboarding/meta" }}
      title="Elige dónde anunciar"
      desc="Encontramos varias en tu Business Manager."
      deskDesc="Encontramos estas cuentas en tu Business Manager."
      bodyClassName="gap-5 lg:grid lg:max-w-none lg:grid-cols-[minmax(0,1fr)_--spacing(75)] lg:items-start lg:gap-8"
      footer={
        <StickyActions variant="bar">
          <Button variant="ghost" loading={busy === "later"} onClick={later} className="max-lg:hidden">
            Conectar después
          </Button>
          <Button variant="primary" size="lg" icon="check" loading={busy === "save"} onClick={save} className="lg:h-control lg:text-row">
            Guardar y terminar
          </Button>
        </StickyActions>
      }
    >
      <div className="flex flex-col gap-5">
        <OptionList label="Cuenta publicitaria" name="cuenta" value={account} onChange={setAccount} options={assets.adAccounts} />
        <OptionList label="Página de Facebook" name="pagina" value={page} onChange={setPage} options={assets.pages} />
        <OptionList label="Píxel" name="pixel" value={pixel} onChange={setPixel} options={assets.pixels} />
      </div>
      <PermissionList title="Qué hará DropFlex con Meta" items={PERMS_META} className="max-lg:hidden" />
    </OnboardingScreen>
  );
}
