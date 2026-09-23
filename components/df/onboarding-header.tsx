import { Button } from "./button";
import { IconButton } from "./icon-button";
import { StageMeter, type MeterStage } from "./stage-meter";

export interface OnboardingHeaderProps {
  step: number;
  total?: number;
  /** Pasos que se pueden saltar: se dibujan solo con contorno. */
  optionalSteps?: number[];
  /** Texto accesible del botón volver; se omite en el paso 1. */
  back?: string;
  backHref?: string;
  /** Atajo para saltar (“Usar sugeridos”). */
  skip?: string;
  onSkip?: () => void;
  stepLabel?: string;
  title?: string;
  /** Para qué se pide el dato, no qué es. */
  desc?: string;
}

/** Encabezado de cada paso del onboarding. Reemplaza a TopBar y a Navigation: no hay pestañas. */
export function OnboardingHeader({
  step,
  total = 4,
  optionalSteps = [],
  back,
  backHref,
  skip,
  onSkip,
  stepLabel,
  title,
  desc,
}: OnboardingHeaderProps) {
  const stages: MeterStage[] = Array.from({ length: total }, (_, n) => {
    const i = n + 1;
    return i < step ? "done" : i === step ? "current" : optionalSteps.includes(i) ? "optional" : "locked";
  });
  return (
    <header className="bg-background px-1 pb-2">
      <div className="flex h-topbar items-center justify-between">
        {back ? <IconButton icon="chevron-left" label={back} href={backHref} /> : <span aria-hidden className="w-11" />}
        <p className="text-label text-muted-foreground">{stepLabel ?? `Paso ${step} de ${total}`}</p>
        {skip ? (
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {skip}
          </Button>
        ) : (
          <span aria-hidden className="w-11" />
        )}
      </div>
      <div className="px-3 pb-4">
        <StageMeter stages={stages} />
      </div>
      {title ? <h1 className="mx-3 text-onboarding text-balance">{title}</h1> : null}
      {desc ? <p className="mx-3 mt-1.5 text-body text-pretty text-muted-foreground">{desc}</p> : null}
    </header>
  );
}
