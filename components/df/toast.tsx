"use client";

import { toast as sonner } from "sonner";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export interface ToastProps {
  /** En pasado: “Imagen descartada”. */
  message: string;
  /** “Deshacer”. */
  action?: string;
  onAction?: () => void;
  className?: string;
}

/** Confirma una acción rápida y permite deshacerla. Reemplaza a los diálogos de confirmación. */
export function Toast({ message, action, onAction, className }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex min-h-12 w-full items-center gap-3 rounded-md bg-foreground py-0 pr-2 pl-4 text-small text-background shadow-md",
        className,
      )}
    >
      <span className="flex-1">{message}</span>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="h-10 cursor-pointer rounded-sm px-3 text-small font-semibold text-background underline underline-offset-3"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

const TOAST_ID = "df-toast";

/** Muestra el toast; el nuevo reemplaza al anterior (no se apilan). Dura 5 s. */
export function notify(message: string, opts: { action?: string; onAction?: () => void } = {}) {
  sonner.custom(
    (id) => (
      <Toast
        message={message}
        action={opts.action}
        onAction={() => {
          opts.onAction?.();
          sonner.dismiss(id);
        }}
      />
    ),
    { id: TOAST_ID, duration: 5000 },
  );
}

/** Con “Deshacer”. */
export function notifyUndo(message: string, onUndo: () => void) {
  notify(message, { action: "Deshacer", onAction: onUndo });
}

/**
 * Contenedor global. Aparece sobre la barra fija: la barra publica su alto en `--df-sticky-h`
 * (ver StickyActions) y la barra de pestañas ocupa `--size-tabbar` bajo lg.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      visibleToasts={1}
      duration={5000}
      gap={0}
      offset={{ bottom: "calc(var(--df-sticky-h, 0px) + var(--space-6))" }}
      mobileOffset={{
        bottom: "calc(var(--df-tabbar-h, 0px) + var(--df-sticky-h, 0px) + var(--space-3) + env(safe-area-inset-bottom))",
        left: "var(--space-4)",
        right: "var(--space-4)",
      }}
      toastOptions={{ unstyled: true, className: "w-full" }}
      className="z-toast"
      containerAriaLabel="Notificaciones"
    />
  );
}
