"use client";

import { usePathname } from "next/navigation";
import { StageList, type Stage as ListStage } from "@/components/df";
import type { Stage, StageKey } from "@/lib/types";

const ROUTED: StageKey[] = ["textos", "imagenes", "precio"];

export function stageHref(productId: string, key: StageKey, state: Stage["state"]): string | undefined {
  if (state === "locked") return undefined;
  if (ROUTED.includes(key)) return `/productos/${productId}/${key}`;
  if (key === "anuncios") return "/campanas";
  return `/productos/${productId}`;
}

/**
 * La ruta del producto. En una pantalla de etapa, esa etapa se marca como actual
 * (la que estaba marcada pasa a disponible), como en el escritorio de la referencia.
 */
export function StageNav({ productId, stages, className }: { productId: string; stages: Stage[]; className?: string }) {
  const pathname = usePathname();
  const onStage = ROUTED.find((k) => pathname.endsWith(`/${k}`));
  const items: ListStage[] = stages.map((s) => {
    let state = s.state;
    if (onStage) {
      if (s.key === onStage) state = "current";
      else if (s.state === "current") state = "available";
    }
    return { title: s.title, state, desc: s.desc, optional: s.optional, href: stageHref(productId, s.key, s.state) };
  });
  return <StageList stages={items} className={className} />;
}
