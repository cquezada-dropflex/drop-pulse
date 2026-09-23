import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

export type ContentStatus = "generado" | "revision" | "aprobado" | "rechazado" | "publicando" | "publicado" | "error";

// Única forma de mostrar el ciclo de vida: color + ícono + palabra, siempre los tres.
// Nunca `primary`: el azul significa "puedes tocar esto".
const STATUS: Record<ContentStatus, { label: string; icon: IconName; tone: string }> = {
  generado: { label: "Generado", icon: "sparkle", tone: "bg-muted text-foreground" },
  revision: { label: "En revisión", icon: "eye", tone: "bg-warning-soft text-warning" },
  aprobado: { label: "Aprobado", icon: "check", tone: "bg-success-soft text-success" },
  rechazado: { label: "Rechazado", icon: "x", tone: "bg-transparent text-muted-foreground inset-ring inset-ring-border" },
  publicando: { label: "Publicándose", icon: "loader", tone: "bg-muted text-foreground" },
  publicado: { label: "Publicado", icon: "check-circle", tone: "bg-success text-background" },
  error: { label: "Con error", icon: "alert", tone: "bg-destructive-soft text-destructive" },
};

export interface StatusBadgeProps {
  status: ContentStatus;
  /** Filas densas. */
  size?: "sm";
  /** Cambia la palabra sin cambiar el significado. */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, size, label, className }: StatusBadgeProps) {
  const s = STATUS[status];
  const publishing = status === "publicando";
  return (
    <span
      role={publishing ? "status" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "h-5 pr-1.5 pl-1 text-micro" : "h-6 pr-2 pl-1.5 text-caption",
        s.tone,
        className,
      )}
    >
      <Icon
        name={s.icon}
        strokeWidth={2}
        className={cn("size-3.5", publishing && "motion-exempt animate-df-spin")}
      />
      {label ?? s.label}
    </span>
  );
}
