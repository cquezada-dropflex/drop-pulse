"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de la acción principal (.df-sticky). En móvil queda fija abajo, en la zona del pulgar,
 * sobre la barra de pestañas. En escritorio (≥lg):
 * - `inline` (por defecto): se alinea a la derecha del bloque.
 * - `bar`: pie fijo con el resumen a la izquierda y las acciones a la derecha (.df-ob-deskfoot).
 * Publica su alto en --df-sticky-h para que el toast aparezca encima.
 */
export function StickyActions({
  children,
  className,
  stack,
  variant = "inline",
  summary,
  mobileNote,
}: {
  children: React.ReactNode;
  className?: string;
  /** En móvil, apila las acciones; `reverse` pone arriba la última (la principal). */
  stack?: boolean | "reverse";
  variant?: "inline" | "bar";
  /** Resumen a la izquierda del pie (solo escritorio, variante `bar`). */
  summary?: React.ReactNode;
  /** Nota bajo las acciones, solo en móvil (“Tu plan incluye 10 productos al mes.”). */
  mobileNote?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      const fixed = !mq.matches;
      root.style.setProperty("--df-sticky-h", fixed ? `${el.offsetHeight}px` : "0px");
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    mq.addEventListener("change", update);
    update();
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
      root.style.removeProperty("--df-sticky-h");
    };
  }, []);

  const bar = variant === "bar";
  return (
    <>
      {/* Reserva el espacio de la barra fija para que no tape el final del contenido. */}
      <div aria-hidden className="h-[var(--df-sticky-h,0px)] lg:hidden" />
      <div
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-[var(--df-tabbar-h,0px)] z-sticky flex gap-2 border-t bg-background px-4 pt-3 pb-[calc(var(--space-3)+var(--df-sticky-safe,env(safe-area-inset-bottom)))] shadow-md",
          bar
            ? "lg:sticky lg:bottom-0 lg:mt-auto lg:items-center lg:px-12 lg:pt-4 lg:pb-4 lg:shadow-none"
            : "lg:static lg:z-auto lg:justify-end lg:border-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:pb-0 lg:shadow-none",
          stack === "reverse" ? "max-lg:flex-col-reverse" : stack ? "max-lg:flex-col" : "max-lg:[&>*]:flex-1",
          className,
        )}
      >
        {bar ? <div className="hidden min-w-0 flex-1 text-body text-muted-foreground lg:block">{summary}</div> : null}
        {children}
        {mobileNote ? <p className="text-center text-label font-normal text-muted-foreground lg:hidden">{mobileNote}</p> : null}
      </div>
    </>
  );
}
