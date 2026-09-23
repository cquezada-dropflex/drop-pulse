import Link from "next/link";
import { Icon, type IconName } from "./icon";
import { cn } from "@/lib/utils";

export type StageState = "done" | "current" | "review" | "available" | "locked" | "error";

export interface Stage {
  title: string;
  state: StageState;
  /** `locked`: de qué depende. `review`/`error`: el motivo, que se lee sin entrar. */
  desc?: string;
  optional?: boolean;
  end?: React.ReactNode;
  /** Pantalla de la etapa. Las bloqueadas no navegan. */
  href?: string;
}

export interface StageListProps {
  stages: Stage[];
  label?: string;
  className?: string;
}

const STAGE_ICON: Partial<Record<StageState, IconName>> = { done: "check", review: "eye", error: "alert", locked: "lock" };

const DOT: Record<StageState, string> = {
  done: "bg-foreground text-background",
  current: "bg-primary text-primary-foreground ring-4 ring-primary-soft",
  review: "bg-warning-soft text-warning inset-ring-(length:--stroke-strong) inset-ring-warning",
  error: "bg-destructive-soft text-destructive inset-ring-(length:--stroke-strong) inset-ring-destructive",
  locked: "bg-background text-muted-foreground inset-ring-(length:--stroke-strong) inset-ring-border",
  available: "bg-background text-muted-foreground inset-ring-(length:--stroke-strong) inset-ring-input",
};

/** La ruta de un producto: etapas en orden, con dependencias y opcionales, para retomar donde quedó. */
export function StageList({ stages, label = "Etapas del producto", className }: StageListProps) {
  return (
    <ol aria-label={label} className={cn("m-0 list-none p-0", className)}>
      {stages.map((s, i) => {
        const locked = s.state === "locked";
        const glyph = STAGE_ICON[s.state];
        const rowClass = cn(
          "relative grid w-full grid-cols-[auto_1fr_auto] items-start gap-3 px-4 py-3 text-left text-inherit",
          s.state === "current" ? "bg-primary-soft" : !locked && "hover:bg-accent",
          locked ? "cursor-default" : "cursor-pointer",
        );
        const content = (
          <>
            {/* Línea que une las etapas (.df-stage::before). */}
            <span
              aria-hidden
              className={cn(
                "absolute left-7.25 w-0.5 bg-border",
                i === 0 ? "top-1/2" : "top-0",
                i === stages.length - 1 ? "bottom-1/2" : "bottom-0",
              )}
            />
            <span className={cn("relative z-1 grid size-7 place-items-center rounded-full text-caption font-semibold", DOT[s.state])}>
              {glyph ? <Icon name={glyph} size="sm" strokeWidth={2.25} /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className={cn("flex flex-wrap items-center gap-2 pt-1 text-row", locked && "text-muted-foreground")}>
                {s.title}
                {s.optional ? (
                  <span className="rounded-full border px-1.5 text-micro font-medium text-muted-foreground">Opcional</span>
                ) : null}
              </span>
              {s.desc ? (
                <span
                  className={cn(
                    "mt-0.5 block text-label font-normal",
                    s.state === "error" ? "text-destructive" : s.state === "review" ? "text-warning" : "text-muted-foreground",
                  )}
                >
                  {s.desc}
                </span>
              ) : null}
            </span>
            <span className="pt-1 text-muted-foreground">
              {s.end ?? (locked ? null : <Icon name="chevron-right" size="sm" />)}
            </span>
          </>
        );
        return (
          <li key={s.title}>
            {locked || !s.href ? (
              <button
                type="button"
                aria-disabled={locked || undefined}
                aria-current={s.state === "current" ? "step" : undefined}
                className={rowClass}
              >
                {content}
              </button>
            ) : (
              <Link href={s.href} aria-current={s.state === "current" ? "step" : undefined} className={rowClass}>
                {content}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
