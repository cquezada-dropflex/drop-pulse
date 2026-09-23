import { Icon } from "./icon";
import { StateChip } from "./state-chip";
import { StatusBadge } from "./status-badge";
import { Thumb } from "./thumb";
import { cn } from "@/lib/utils";

export interface GenerationItem {
  name: string;
  image?: string;
  /** `publicando` se muestra como “Generando”; `cola` como “En cola”. */
  status: "generado" | "publicando" | "cola" | "error" | "aprobado";
  detail?: string;
}

export interface GenerationProgressProps {
  items: GenerationItem[];
  eta?: string;
  title?: string;
  /** Solo encabezado y barra (mientras conecta Meta). */
  compact?: boolean;
  action?: React.ReactNode;
  className?: string;
}

/** Avance de la IA generando contenido. Un producto con error no detiene a los demás. */
export function GenerationProgress({ items, eta, title, compact, action, className }: GenerationProgressProps) {
  const done = items.filter((i) => i.status === "generado" || i.status === "aprobado").length;
  const working = done < items.length && items.some((i) => i.status === "publicando" || i.status === "cola");
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <Icon name="sparkle" className={working ? "animate-df-pulse" : undefined} />
        <div className="min-w-0 flex-1">
          <p className="text-row font-semibold">{title ?? (working ? "Generando contenido" : "Todo listo para revisar")}</p>
          <p className="text-caption text-muted-foreground" aria-live="polite">
            {done} de {items.length} productos listos{eta && working ? ` · ${eta}` : ""}
          </p>
        </div>
        {action}
      </div>
      <div
        role="progressbar"
        aria-label="Productos listos"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={done}
        className="h-1.5 overflow-hidden rounded-full bg-muted inset-ring inset-ring-border"
      >
        <span
          className="block h-full rounded-full bg-primary transition-[width] duration-slow ease-standard"
          style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }}
        />
      </div>
      {compact ? null : (
        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.name} className="flex items-center gap-3 py-2 not-first:border-t">
              <Thumb src={it.image} size={36} className="size-9" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-small font-medium">{it.name}</span>
                {it.detail ? (
                  <span className="text-caption text-muted-foreground">{it.detail}</span>
                ) : null}
              </span>
              {it.status === "cola" ? (
                <StateChip label="En cola" icon="clock" tone="quiet" size="sm" />
              ) : (
                <StatusBadge status={it.status} size="sm" label={it.status === "publicando" ? "Generando" : undefined} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
