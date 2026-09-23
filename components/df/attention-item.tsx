import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

export type AttentionKind = "review" | "error" | "ads" | "ads-up" | "stuck";

const KIND: Record<AttentionKind, { icon: IconName; className: string }> = {
  review: { icon: "sparkle", className: "bg-muted text-foreground" },
  error: { icon: "alert", className: "bg-destructive-soft text-destructive" },
  ads: { icon: "megaphone", className: "bg-warning-soft text-warning" },
  "ads-up": { icon: "trend", className: "bg-success-soft text-success" },
  stuck: { icon: "clock", className: "bg-warning-soft text-warning" },
};

export interface AttentionItemProps {
  kind?: AttentionKind;
  /** Qué hay que hacer, en imperativo o como hecho. */
  title: string;
  /** Dónde. */
  product?: string;
  /** La cifra o razón que lo justifica. */
  detail?: string;
  /** 0–2 `Button` `sm`. Una `primary` como máximo, y solo en el primer grupo. */
  actions?: React.ReactNode;
  className?: string;
}

/** Una decisión pendiente en Hoy, con la acción para resolverla ahí mismo. */
export function AttentionItem({ kind = "review", title, product, detail, actions, className }: AttentionItemProps) {
  const k = KIND[kind];
  return (
    <div className={cn("flex gap-3 bg-card p-4 not-first:border-t", className)}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-md", k.className)}>
        <Icon name={k.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-row">{title}</h3>
        {product ? <p className="mt-0.5 text-caption text-muted-foreground">{product}</p> : null}
        {detail ? <p className="mt-1 text-label font-normal text-muted-foreground">{detail}</p> : null}
        {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
