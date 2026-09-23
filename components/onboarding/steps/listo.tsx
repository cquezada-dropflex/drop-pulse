"use client";

import { Button, ConnectionCard, GenerationProgress, Icon } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import { useOnboarding } from "../provider";
import { OnboardingScreen } from "../screen";

// Productos que ya tienen su ruta en la app de ejemplo (lib/mock/products.ts).
const KNOWN = new Set(["corrector-de-postura", "lampara-lunar-3d", "botella-termica-1l", "masajeador-de-cuello"]);

/** Terminar en trabajo real: lleva directo a revisar el primer producto generado. */
export function ListoStep() {
  const { snapshot } = useOnboarding();
  const g = snapshot.generation;
  const first = g?.firstReady;
  const waiting = g?.items[0];
  const reviewHref = first ? (KNOWN.has(first.id) ? `/products/${first.id}/copy` : "/products") : undefined;
  const meta = snapshot.meta;

  return (
    <OnboardingScreen
      hideHeader
      title={first ? "Tu primer producto está listo" : "Estamos preparando tus productos"}
      bodyClassName="gap-5 pt-8 lg:pt-12"
      footer={
        <StickyActions variant="bar" stack="reverse" summary="Los demás siguen generándose; te avisamos en Hoy al terminar.">
          <Button href="/today" variant="ghost" block className="lg:w-auto">
            Ir a Hoy
          </Button>
          {reviewHref ? (
            <Button href={reviewHref} variant="primary" size="lg" block iconEnd="chevron-right" className="lg:h-control lg:w-auto lg:text-row">
              Revisar {first!.name}
            </Button>
          ) : (
            <Button variant="primary" size="lg" block loading className="lg:h-control lg:w-auto lg:text-row">
              Generando {waiting?.name ?? "tus productos"}
            </Button>
          )}
        </StickyActions>
      }
    >
      <span aria-hidden className="grid size-14 place-items-center rounded-full bg-success text-background">
        <Icon name="check" strokeWidth={2.5} className="size-7" />
      </span>
      <div className="lg:max-w-content">
        <h1 className="text-onboarding text-balance lg:text-display">{first ? "Tu primer producto está listo" : "Estamos preparando tus productos"}</h1>
        <p className="mt-1.5 text-body text-pretty text-muted-foreground">
          {first
            ? "Revisa lo que propuso la IA. Los demás siguen generándose; te avisamos al terminar."
            : "El primero estará listo en segundos. Puedes esperar aquí o ir a Hoy."}
        </p>
      </div>
      {g ? (
        <div className="rounded-lg border bg-card p-4 lg:max-w-content">
          <GenerationProgress items={g.items} eta={g.eta} />
        </div>
      ) : null}
      <div className="flex flex-col gap-2 lg:max-w-content">
        <ConnectionCard provider="shopify" state="connected" account={snapshot.shop?.domain} />
        {meta?.status === "connected" ? (
          <ConnectionCard provider="meta" state="connected" account={[meta.account, meta.pixel].filter(Boolean).join(" · ")} />
        ) : (
          <ConnectionCard
            provider="meta"
            state="later"
            account="Conéctala cuando quieras anunciar"
            actions={
              <Button size="sm" href="/onboarding/meta">
                Conectar
              </Button>
            }
          />
        )}
      </div>
    </OnboardingScreen>
  );
}
