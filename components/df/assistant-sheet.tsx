"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Icon } from "./icon";
import { IconButton } from "./icon-button";
import { cn } from "@/lib/utils";

export interface AssistantMessage {
  from: "user" | "ai";
  text: string | string[];
  /** La respuesta propone un cambio: el botón lo crea como propuesta (`generado`), nunca lo aplica directo. */
  apply?: string;
}

export interface AssistantSheetProps {
  /** `sheet`: hoja inferior (móvil). `panel`: panel derecho de 340px (escritorio). */
  variant?: "sheet" | "panel";
  /** Sobre qué responde: “Corrector de postura · Precio”. */
  context?: string;
  contextImage?: string;
  messages?: AssistantMessage[];
  suggestions?: string[];
  placeholder?: string;
  /** Dibuja el asa propia; dentro de un Drawer la pone el Drawer. */
  grab?: boolean;
  onClose?: () => void;
  onSend?: (text: string) => void;
  onApply?: (message: AssistantMessage) => void;
  /** Id del título, para `aria-labelledby` del contenedor. */
  titleId?: string;
  /** Lleva el foco al campo de mensaje al abrirse. */
  autoFocus?: boolean;
  /** Título accesible (por ejemplo, DrawerTitle). Por defecto, un <h2>. */
  renderTitle?: (children: React.ReactNode) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Asistente que responde sobre el producto sin sacarte de lo que estás viendo. */
export function AssistantSheet({
  variant = "sheet",
  context,
  contextImage,
  messages = [],
  suggestions,
  placeholder = "Pregunta sobre este producto",
  grab = variant === "sheet",
  onClose,
  onSend,
  onApply,
  titleId,
  autoFocus,
  renderTitle,
  className,
  style,
}: AssistantSheetProps) {
  const [draft, setDraft] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoFocus) input.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  // Mantiene visible el último mensaje.
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);
  const panel = variant === "panel";
  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    onSend?.(t);
    setDraft("");
  };
  const title = <span className="flex-1 text-heading">Asistente</span>;

  return (
    <aside
      aria-label="Asistente"
      style={style}
      className={cn(
        "flex min-h-0 flex-col bg-popover text-popover-foreground",
        panel ? "h-full border-l" : "rounded-t-lg shadow-lg",
        className,
      )}
    >
      {grab ? <div aria-hidden className="mx-auto mt-2 h-1 w-9 shrink-0 rounded-full bg-input" /> : null}
      <div className="flex items-center gap-2 py-2 pr-2 pl-4">
        <Icon name="sparkle" />
        {renderTitle ? renderTitle(title) : <h2 id={titleId} className="contents">{title}</h2>}
        <IconButton icon="x" label="Cerrar asistente" onClick={onClose} />
      </div>

      {context ? (
        <div className="px-4">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted py-1 pr-2 pl-1 text-caption text-muted-foreground">
            {contextImage ? (
              <Image src={contextImage} alt="" width={20} height={20} unoptimized className="size-5 shrink-0 rounded-full object-cover" />
            ) : (
              <Icon name="box" size="sm" className="ml-0.5" />
            )}
            <span className="truncate">
              Sobre <b className="font-medium text-foreground">{context}</b>
            </span>
          </span>
        </div>
      ) : null}

      <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-11/12 text-small",
              m.from === "user"
                ? "self-end rounded-lg rounded-br-sm bg-muted px-3 py-2"
                : "self-start [&_p]:mb-2 [&_p:last-child]:mb-0",
            )}
          >
            {m.from === "ai" ? (
              (Array.isArray(m.text) ? m.text : [m.text]).map((t, j) => <p key={j}>{t}</p>)
            ) : (
              <>
                <span className="sr-only">Tú: </span>
                {m.text}
              </>
            )}
            {m.apply ? (
              <div className="mt-2 flex gap-2">
                <Button size="sm" icon="check" onClick={() => onApply?.(m)}>
                  {m.apply}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        <div ref={end} />
      </div>

      {suggestions?.length ? (
        <div className="flex scrollbar-none gap-2 overflow-x-auto px-4 pb-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="relative h-8 shrink-0 cursor-pointer rounded-full border border-input bg-background px-3 text-label font-normal whitespace-nowrap text-foreground before:absolute before:inset-x-0 before:-inset-y-1.5 hover:bg-accent"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className={cn("flex items-center gap-2 border-t px-3 pt-2 pb-3", !panel && "pb-[calc(var(--space-3)+env(safe-area-inset-bottom))]")}
      >
        <input
          ref={input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label="Mensaje para el asistente"
          data-focus="within"
          className="h-touch min-w-0 flex-1 rounded-full border border-input bg-background px-4 text-heading font-normal text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-3 focus:ring-primary-soft"
        />
        <IconButton icon="send" label="Enviar" variant="primary" type="submit" />
      </form>
    </aside>
  );
}
