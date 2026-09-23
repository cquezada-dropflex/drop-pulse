import { cn } from "@/lib/utils";

export type MeterStage = "done" | "current" | "review" | "stuck" | "error" | "locked" | "optional";

const TONE: Record<MeterStage, string> = {
  done: "bg-foreground",
  current: "bg-primary",
  review: "bg-warning",
  stuck: "bg-warning",
  error: "bg-destructive",
  locked: "bg-muted inset-ring inset-ring-border",
  optional: "bg-transparent inset-ring inset-ring-input",
};

export interface StageMeterProps {
  stages: MeterStage[];
  className?: string;
}

/** Una rayita por etapa. Siempre va acompañado del motivo en texto. */
export function StageMeter({ stages, className }: StageMeterProps) {
  const done = stages.filter((s) => s === "done").length;
  const required = stages.filter((s) => s !== "optional").length;
  return (
    <div role="img" aria-label={`${done} de ${required} etapas completas`} className={cn("flex h-1.5 gap-0.75", className)}>
      {stages.map((s, i) => (
        <span key={i} className={cn("flex-1 rounded-full", TONE[s])} />
      ))}
    </div>
  );
}
