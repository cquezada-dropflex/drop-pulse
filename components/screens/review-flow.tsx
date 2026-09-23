"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Icon, ReviewActions, ReviewCard, StatusBadge, notifyUndo } from "@/components/df";
import { StickyActions } from "@/components/shell/sticky-actions";
import type { ContentItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Decision = "aprobado" | "rechazado";

export interface ReviewFlowProps {
  items: ContentItem[];
  /** Adónde ir cuando no queda nada por revisar. */
  nextHref?: string;
  nextLabel?: string;
  /** Persistencia (hoy, mock). */
  onDecide?: (id: string, status: ContentItem["status"], text?: string) => void;
  className?: string;
}

const EXIT_MS = 200; // duration-base

const pending = (i: ContentItem) => i.status === "generado" || i.status === "revision";

/**
 * Revisión de una propuesta a la vez. Aceptar o descartar avanza sola a la siguiente
 * (200ms, ease-exit) y muestra un toast con “Deshacer”. Sin confirmaciones. Atajos A / D / E.
 */
export function ReviewFlow({ items: initial, nextHref, nextLabel, onDecide, className }: ReviewFlowProps) {
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const total = items.length;
  const current = items.find(pending);
  const index = current ? items.indexOf(current) + 1 : total;
  const accepted = items.filter((i) => i.status === "aprobado").length;
  const left = items.filter(pending).length;

  const setStatus = useCallback(
    (id: string, status: ContentItem["status"], text?: string) => {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status, proposal: text ?? i.proposal } : i)));
      onDecide?.(id, status, text);
    },
    [onDecide],
  );

  const decide = useCallback(
    (decision: Decision, text?: string) => {
      if (!current || leaving) return;
      const { id, status: before, proposal: beforeText } = current;
      setEditing(false);
      setLeaving(true);
      timer.current = window.setTimeout(() => {
        setStatus(id, decision, text);
        setLeaving(false);
      }, EXIT_MS);
      notifyUndo(decision === "aprobado" ? "Propuesta aceptada" : "Propuesta descartada", () => {
        window.clearTimeout(timer.current);
        setLeaving(false);
        setStatus(id, before, beforeText);
      });
    },
    [current, leaving, setStatus],
  );

  // Atajos de escritorio: A aceptar, D descartar, E editar (fuera de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (editing || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const k = e.key.toLowerCase();
      if (k === "a") decide("aprobado");
      else if (k === "d") decide("rechazado");
      else if (k === "e" && current) setEditing(true);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, editing, current]);

  if (!current) {
    return (
      <div className={cn("flex flex-col items-center gap-3 px-4 py-12 text-center", className)}>
        <span className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <Icon name="check" strokeWidth={2.25} />
        </span>
        <h2 className="text-heading">Revisaste todas las propuestas</h2>
        <p className="text-body text-muted-foreground">
          {accepted} aceptadas · {total - accepted} descartadas
        </p>
        {nextHref ? (
          <Button href={nextHref} variant="primary" iconEnd="chevron-right">
            {nextLabel ?? "Continuar"}
          </Button>
        ) : null}
      </div>
    );
  }

  const upcoming = items.filter((i) => pending(i) && i.id !== current.id);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn(
          "transition-[opacity,translate] duration-base",
          leaving ? "-translate-y-2 opacity-0 ease-exit" : "translate-y-0 opacity-100 ease-enter",
        )}
      >
        <ReviewCard
          key={current.id}
          field={current.field}
          original={current.original}
          proposal={current.proposal}
          proposalText={current.proposal}
          index={index}
          total={total}
          state={editing ? "editing" : "pending"}
          layout="side"
          hideActions
          onCancelEdit={() => setEditing(false)}
          onSaveEdit={(text) => decide("aprobado", text)}
        />
      </div>

      {current.note ? (
        <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
          <Icon name="sparkle" size="sm" />
          {current.note}
        </p>
      ) : null}

      <p className="sr-only" aria-live="polite">
        {accepted} aceptadas, {left} pendientes
      </p>

      {editing ? (
        <StickyActions>
          <Button variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon="check"
            onClick={() => {
              const ta = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Editar propuesta"]');
              decide("aprobado", ta?.value);
            }}
          >
            Guardar y aceptar
          </Button>
        </StickyActions>
      ) : (
        <StickyActions stack>
          <ReviewActions
            keys
            disabled={leaving}
            onAccept={() => decide("aprobado")}
            onDiscard={() => decide("rechazado")}
            onEdit={() => setEditing(true)}
            className="lg:flex lg:justify-end lg:[&>*]:w-auto"
          />
        </StickyActions>
      )}

      {upcoming.length ? (
        <div className="hidden lg:block">
          <h2 className="pt-7 pb-2 text-label font-semibold text-muted-foreground">Siguientes</h2>
          <ul className="overflow-hidden rounded-lg border bg-card">
            {upcoming.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3 not-first:border-t">
                <span className="flex-1 truncate text-row">{i.field}</span>
                <StatusBadge status={i.status} size="sm" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
