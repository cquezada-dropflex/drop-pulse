"use client";

import { usePathname } from "next/navigation";
import { GenerationProgress, StageList, StateChip, type Stage } from "@/components/df";
import { count, money } from "@/lib/format";
import { STEP_PATH } from "@/lib/onboarding/paths";
import { useOnboarding } from "./provider";

const ORDER = ["shopify", "productos", "numeros", "meta"] as const;

/** Escritorio: columna izquierda de 232px con los pasos y el estado de lo conectado o de la generación. */
export function OnboardingSide() {
  const { snapshot: s } = useOnboarding();
  const pathname = usePathname();
  const routeStep = ORDER.find((k) => pathname.startsWith(STEP_PATH[k])) ?? (pathname.startsWith("/onboarding/listo") ? "listo" : null);
  const pendingIndex = s.step === "meta-cuentas" ? 3 : s.step === "listo" ? 4 : ORDER.indexOf(s.step as (typeof ORDER)[number]);
  const n = s.numbers ?? { deliveredOf10: 8, maxCpa: 6000 };

  const desc = [
    s.shop?.domain ?? "Trae tus productos",
    s.selected.length ? `${s.selected.length} elegidos` : "Recomendados por ventas",
    `Entrega ${n.deliveredOf10} de 10 · CPA ${money(n.maxCpa)}`,
    s.meta?.status === "connected" ? (s.meta.account ?? "Conectada") : "Puedes hacerlo después",
  ];
  const titles = ["Conectar Shopify", "Elegir productos", "Tus números", "Conectar Meta Ads"];

  const stages: Stage[] = ORDER.map((key, i) => {
    const current = routeStep === key;
    const done = i < pendingIndex && !current;
    const state = current ? "current" : done ? "done" : i === pendingIndex ? "available" : "locked";
    return {
      title: titles[i],
      state,
      desc: desc[i],
      optional: key === "meta",
      href: state === "locked" ? undefined : STEP_PATH[key],
    };
  });

  return (
    <aside className="sticky top-0 hidden h-svh w-rail shrink-0 flex-col gap-2 border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground lg:flex">
      <div className="flex items-center gap-2 px-5 pt-1 pb-5 text-heading tracking-brand">
        <span aria-hidden className="grid size-5.5 place-items-center rounded-sm bg-foreground text-caption font-bold text-background">
          D
        </span>
        DropFlex
      </div>
      <p className="px-4 text-caption font-semibold tracking-label text-muted-foreground uppercase">Configura tu cuenta</p>
      <StageList stages={stages} label="Pasos para configurar tu cuenta" />
      <div className="flex-1" />
      {s.generation ? (
        <div className="mx-3 rounded-lg border bg-card p-4">
          <GenerationProgress compact items={s.generation.items} eta={s.generation.eta} />
        </div>
      ) : s.shop && (s.shop.status === "connected" || s.shop.status === "importing") ? (
        <div className="mx-4 flex flex-col items-start gap-1.5 text-caption text-muted-foreground">
          <StateChip label="Shopify conectada" icon="check" tone="success" />
          <span>
            {s.shop.status === "importing"
              ? `${count(s.shop.imported)} de ${count(s.shop.total)} productos importados`
              : `${count(s.shop.total)} productos importados · ${s.shop.currency}`}
          </span>
        </div>
      ) : null}
    </aside>
  );
}
