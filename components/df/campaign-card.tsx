import { Button } from "./button";
import { Icon, type IconName } from "./icon";
import { IconButton } from "./icon-button";
import { MetricGrid, type MetricProps } from "./metric";
import { Thumb } from "./thumb";
import { cn } from "@/lib/utils";

export type Verdict = "subir" | "seguir" | "vigilar" | "apagar" | "aprendiendo";

const VERDICT: Record<Verdict, { title: string; icon: IconName; box: string; ico: string; title_: string }> = {
  subir: { title: "Sube el presupuesto", icon: "arrow-up", box: "bg-success-soft", ico: "bg-success text-background", title_: "text-success" },
  seguir: { title: "Déjala seguir", icon: "check", box: "bg-muted", ico: "bg-foreground text-background", title_: "" },
  vigilar: { title: "Vigílala", icon: "eye", box: "bg-warning-soft", ico: "bg-warning text-background", title_: "text-warning" },
  apagar: { title: "Apágala", icon: "power", box: "bg-destructive-soft", ico: "bg-destructive text-background", title_: "text-destructive" },
  aprendiendo: { title: "Aún aprendiendo", icon: "clock", box: "bg-transparent inset-ring inset-ring-border", ico: "bg-muted text-muted-foreground", title_: "" },
};

export interface VerdictProps {
  verdict: Verdict;
  /** Una frase que cita la cifra y la compara con el límite del comerciante. */
  reason: string;
  title?: string;
}

/** Qué hacer con la campaña, con la razón. */
export function VerdictNote({ verdict, reason, title }: VerdictProps) {
  const v = VERDICT[verdict];
  return (
    <div role="note" className={cn("flex items-start gap-3 rounded-md p-3", v.box)}>
      <span className={cn("grid size-8 shrink-0 place-items-center rounded-sm", v.ico)}>
        <Icon name={v.icon} strokeWidth={2.25} />
      </span>
      <div>
        <div className={cn("text-row font-semibold", v.title_)}>{title ?? v.title}</div>
        <div className="mt-0.5 text-label font-normal text-foreground">{reason}</div>
      </div>
    </div>
  );
}

export interface CampaignCardProps {
  name: string;
  image?: string;
  verdict?: Verdict;
  reason: string;
  verdictTitle?: string;
  metrics?: MetricProps[];
  /** Presupuesto al que sugiere subir: “$15.000”. */
  nextBudget?: string;
  paused?: boolean;
  /** “Meta Ads · 3 días”. */
  meta?: string;
  /** Acciones propias; `null` para ninguna. Por defecto, según el veredicto. */
  actions?: React.ReactNode[] | null;
  /** Detalle de la campaña (“Ver detalle”). */
  href?: string;
  /** Cuatro métricas por fila en escritorio. */
  wide?: boolean;
  /** Menú “Más opciones”. */
  menu?: React.ReactNode;
  headingLevel?: "h2" | "h3";
  className?: string;
}

/** Orden fijo: veredicto → razón con cifras → métricas → acción. */
export function CampaignCard({
  name,
  image,
  verdict = "seguir",
  reason,
  verdictTitle,
  metrics,
  nextBudget = "$15.000",
  paused,
  meta = "Meta Ads · 3 días",
  actions,
  href,
  wide,
  menu,
  headingLevel: H = "h2",
  className,
}: CampaignCardProps) {
  let acts = actions;
  if (acts === undefined) {
    if (verdict === "subir")
      acts = [
        <Button key="a" href={href ?? "#"}>
          Ver detalle
        </Button>,
        <Button key="b" variant="primary" icon="arrow-up">
          Subir a {nextBudget}
        </Button>,
      ];
    else if (verdict === "apagar")
      acts = [
        <Button key="a">Mantener</Button>,
        <Button key="b" variant="destructive" icon="power">
          Apagar
        </Button>,
      ];
    else acts = null;
  }

  return (
    <article className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground", className)}>
      <div className="flex items-center gap-3">
        <Thumb src={image} size={40} className="size-10" />
        <div className="min-w-0 flex-1">
          <H className="text-row font-semibold">{name}</H>
          <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <span aria-hidden className={cn("inline-block size-2 rounded-full", paused ? "bg-input" : "bg-success")} />
            {paused ? "Pausada" : "Activa"} · {meta}
          </div>
        </div>
        {menu ?? <IconButton icon="more" label={`Más opciones de ${name}`} />}
      </div>
      <VerdictNote verdict={verdict} reason={reason} title={verdictTitle} />
      {metrics?.length ? <MetricGrid metrics={metrics} wide={wide} /> : null}
      {acts?.length ? (
        <div className="grid grid-cols-5 gap-2 [&>*]:min-w-0 [&>*]:px-3 [&>*:first-child]:col-span-2 [&>*:last-child]:col-span-3">
          {acts}
        </div>
      ) : null}
    </article>
  );
}
