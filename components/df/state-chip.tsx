import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

// Chips de estado de conexión y de cola (bundle.js → CONN y "En cola"). Usan el mismo dibujo que
// StatusBadge, pero NO son estados del ciclo de vida del contenido: esos van siempre con StatusBadge.
const TONE = {
  progress: "bg-muted text-foreground",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-destructive-soft text-destructive",
  quiet: "bg-transparent text-muted-foreground inset-ring inset-ring-border",
} as const;

export function StateChip({
  label,
  icon,
  tone,
  spin,
  size,
}: {
  label: string;
  icon: IconName;
  tone: keyof typeof TONE;
  spin?: boolean;
  size?: "sm";
}) {
  return (
    <span
      role={spin ? "status" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "h-5 pr-1.5 pl-1 text-micro" : "h-6 pr-2 pl-1.5 text-caption",
        TONE[tone],
      )}
    >
      <Icon name={icon} strokeWidth={2} className={cn("size-3.5", spin && "animate-df-spin")} />
      {label}
    </span>
  );
}
