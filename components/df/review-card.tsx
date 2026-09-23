"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Icon } from "./icon";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

export type ReviewState = "pending" | "editing" | "accepted" | "discarded";

export interface ReviewCardProps {
  field: string;
  /** Texto original; puede faltar si no había. */
  original?: React.ReactNode;
  proposal?: React.ReactNode;
  /** Texto plano de la propuesta, para editarla. */
  proposalText?: string;
  index?: number;
  total?: number;
  state?: ReviewState;
  /** Muestra los atajos A / D / E (escritorio). */
  keys?: boolean;
  /** Las acciones viven en la barra fija (móvil). */
  hideActions?: boolean;
  /** Escritorio: original y propuesta lado a lado. */
  layout?: "stacked" | "side";
  onAccept?: () => void;
  onDiscard?: () => void;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  /** "Guardar y aceptar" es una sola acción. */
  onSaveEdit?: (text: string) => void;
  className?: string;
}

/** Compara el original con la propuesta de la IA. Orden fijo: Descartar · Editar · Aceptar. */
export function ReviewCard({
  field,
  original,
  proposal,
  proposalText = "",
  index,
  total,
  state = "pending",
  keys,
  hideActions,
  layout = "stacked",
  onAccept,
  onDiscard,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  className,
}: ReviewCardProps) {
  const editing = state === "editing";
  const [draft, setDraft] = useState(proposalText);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const wasEditing = useRef(editing);
  // Al pasar a editar (no al montar), el foco va al área de texto.
  useEffect(() => {
    if (editing && !wasEditing.current) textarea.current?.focus();
    wasEditing.current = editing;
  }, [editing]);
  const [editingFor, setEditingFor] = useState(proposalText);
  // Al entrar a editar otra propuesta, el borrador parte de su texto.
  if (editingFor !== proposalText) {
    setEditingFor(proposalText);
    setDraft(proposalText);
  }

  return (
    <section aria-label={`Revisar ${field}`} className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-label text-muted-foreground">{field}</h2>
        {total ? (
          <span className="text-caption text-muted-foreground">
            {index} de {total}
          </span>
        ) : null}
      </div>

      <div className={cn("grid gap-3", layout === "side" && "lg:grid-cols-2 lg:gap-4")}>
        {original != null ? (
          <div className="rounded-md bg-muted p-3">
            <div className="flex items-center gap-1 text-micro font-semibold tracking-label text-muted-foreground uppercase">
              Original
            </div>
            <div className="mt-1 text-small text-muted-foreground [&_del]:decoration-destructive">{original}</div>
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-md border-(length:--stroke-strong) border-foreground bg-card p-3 transition-[border-color,box-shadow] duration-base ease-standard",
            editing && "border-primary ring-3 ring-primary-soft",
            state === "accepted" && "border-success",
            state === "discarded" && "border-dashed border-input text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-1 text-micro font-semibold tracking-label text-muted-foreground uppercase">
            <Icon name="sparkle" size="sm" />
            {editing ? "Tu versión" : "Propuesta"}
            {state === "accepted" ? <StatusBadge status="aprobado" size="sm" className="ml-auto" /> : null}
            {state === "discarded" ? <StatusBadge status="rechazado" size="sm" className="ml-auto" /> : null}
          </div>
          {editing ? (
            <textarea
              aria-label="Editar propuesta"
              data-focus="within"
              ref={textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-1 min-h-22 w-full resize-y border-0 bg-transparent p-0 text-body text-foreground outline-none"
            />
          ) : (
            <div className="mt-1 text-body [&_ins]:rounded-swatch [&_ins]:bg-success-soft [&_ins]:px-0.5 [&_ins]:text-inherit [&_ins]:no-underline">
              {proposal}
            </div>
          )}
        </div>
      </div>

      {hideActions ? null : editing ? (
        <div className="grid grid-cols-5 gap-2">
          <Button variant="ghost" className="col-span-2 w-full min-w-0 px-2" onClick={onCancelEdit}>
            Cancelar
          </Button>
          <Button variant="primary" icon="check" className="col-span-3 w-full min-w-0 px-2" onClick={() => onSaveEdit?.(draft)}>
            Guardar y aceptar
          </Button>
        </div>
      ) : (
        <ReviewActions keys={keys} onAccept={onAccept} onDiscard={onDiscard} onEdit={onEdit} />
      )}
    </section>
  );
}

/** Descartar · Editar · Aceptar. También se usa sola en la barra fija inferior. */
export function ReviewActions({
  keys,
  onAccept,
  onDiscard,
  onEdit,
  disabled,
  className,
}: {
  keys?: boolean;
  onAccept?: () => void;
  onDiscard?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const btn = "w-full min-w-0 gap-1.5 px-2 text-small font-medium";
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <Button icon="x" kbd={keys ? "D" : null} className={btn} onClick={onDiscard} disabled={disabled}>
        Descartar
      </Button>
      <Button icon="edit" kbd={keys ? "E" : null} className={btn} onClick={onEdit} disabled={disabled}>
        Editar
      </Button>
      <Button variant="primary" icon="check" kbd={keys ? "A" : null} className={btn} onClick={onAccept} disabled={disabled}>
        Aceptar
      </Button>
    </div>
  );
}
