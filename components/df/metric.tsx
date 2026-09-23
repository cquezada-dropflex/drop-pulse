import { Icon } from "./icon";
import { cn } from "@/lib/utils";

export type MetricTrend = "good" | "bad" | "warn";

export interface MetricProps {
  label: string;
  value: string;
  /** La referencia: “Límite $6.000”. */
  target?: string;
  trend?: MetricTrend;
}

const TREND = {
  good: { icon: "check", strokeWidth: 2.25, className: "text-success" },
  bad: { icon: "alert", strokeWidth: 2, className: "text-destructive" },
  warn: { icon: "clock", strokeWidth: 2, className: "text-warning" },
} as const;

/** Una cifra con su referencia. El valor queda en `foreground`; la referencia lleva ícono y color. */
export function Metric({ label, value, target, trend, className }: MetricProps & { className?: string }) {
  const t = trend ? TREND[trend] : null;
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5 bg-card p-3", className)}>
      <span className="text-caption text-muted-foreground">{label}</span>
      <span className="text-metric">{value}</span>
      {target ? (
        <span className={cn("flex items-center gap-1 text-caption", t ? t.className : "text-muted-foreground")}>
          {t ? <Icon name={t.icon} size="sm" strokeWidth={t.strokeWidth} /> : null}
          {target}
        </span>
      ) : null}
    </div>
  );
}

/** Agrupa métricas de a dos (.df-metrics). Con `wide`, en escritorio muestra las cuatro (2×2); en móvil, solo las dos primeras. */
export function MetricGrid({ metrics, wide, className }: { metrics: MetricProps[]; wide?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-md border bg-border",
        className,
      )}
    >
      {metrics.map((m, i) => (
        <Metric key={`${m.label}-${i}`} {...m} className={wide && i >= 2 ? "max-lg:hidden" : undefined} />
      ))}
    </div>
  );
}
