import Link from "next/link";
import { Icon, type IconName } from "./icon";
import { StageMeter, type MeterStage } from "./stage-meter";
import { Thumb } from "./thumb";
import { cn } from "@/lib/utils";

export type RowTone = "warning" | "danger" | "success" | "primary" | "muted";

const WHY: Record<RowTone, { icon: IconName; className: string }> = {
  warning: { icon: "clock", className: "text-warning" },
  danger: { icon: "alert", className: "text-destructive" },
  success: { icon: "check-circle", className: "text-success" },
  primary: { icon: "chevron-right", className: "text-primary" },
  muted: { icon: "minus", className: "text-muted-foreground" },
};

type BaseProps = {
  name: string;
  image?: string;
  stages?: MeterStage[];
  end?: React.ReactNode;
  /** Toda la fila lleva al producto en la etapa que lo detiene. */
  href?: string;
  onClick?: () => void;
  className?: string;
};

// El motivo es obligatorio cuando el producto no avanza ("Detenido: falta el precio · 3 días").
export type ProductRowProps = BaseProps &
  (
    | { tone: "warning" | "danger"; reason: string }
    | { tone?: RowTone; reason?: string }
  );

export const rowClasses =
  "flex w-full items-center gap-3 bg-card px-4 py-3 text-left text-inherit not-first:border-t hover:bg-accent";

export function ProductRow({ name, image, stages, reason, tone = "muted", end, href, onClick, className }: ProductRowProps) {
  const why = WHY[tone];
  const content = (
    <>
      <Thumb src={image} />
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate text-row">{name}</span>
        {stages ? <StageMeter stages={stages} /> : null}
        {reason ? (
          <span className={cn("flex min-w-0 items-center gap-1 text-caption", why.className)}>
            <Icon name={why.icon} size="sm" strokeWidth={2} />
            <span className="truncate">{reason}</span>
          </span>
        ) : null}
      </span>
      <span className="flex items-center text-muted-foreground">{end ?? <Icon name="chevron-right" size="sm" />}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(rowClasses, className)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(rowClasses, "cursor-pointer", className)}>
      {content}
    </button>
  );
}
