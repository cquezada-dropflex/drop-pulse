import { Button } from "./button";
import { Icon } from "./icon";
import { IconButton } from "./icon-button";
import { StageMeter } from "./stage-meter";
import { cn } from "@/lib/utils";

export interface SetupItem {
  title: string;
  desc?: string;
  done?: boolean;
  action?: string;
  actionHref?: string;
}

export interface SetupChecklistProps {
  title?: string;
  items: SetupItem[];
  /** La x: se oculta aquí y sigue disponible en Ajustes. */
  onHide?: () => void;
  className?: string;
}

/**
 * Lo que falta configurar después del onboarding, en Hoy. Lo pendiente lleva un botón `secondary`
 * pequeño: nunca `primary`, porque la acción principal de Hoy sigue siendo revisar.
 */
export function SetupChecklist({ title = "Termina de configurar", items, onHide, className }: SetupChecklistProps) {
  const done = items.filter((i) => i.done).length;
  return (
    <section aria-label="Configuración" className={cn("flex flex-col gap-3 rounded-lg border bg-card p-4", className)}>
      <div className="-mt-1.5 -mr-2 flex items-start gap-2">
        <div className="flex-1 pt-1.5">
          <h2 className="text-row font-semibold">{title}</h2>
          <p className="text-label font-normal text-muted-foreground">
            {done} de {items.length} listos
          </p>
        </div>
        {onHide ? <IconButton icon="x" label="Ocultar" onClick={onHide} /> : null}
      </div>
      <StageMeter stages={items.map((i) => (i.done ? "done" : "locked"))} />
      <ul className="flex flex-col">
        {items.map((it) => (
          <li key={it.title} className="flex min-h-11 items-center gap-3 py-2">
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full",
                it.done ? "bg-foreground text-background" : "inset-ring-(length:--stroke-strong) inset-ring-input",
              )}
            >
              {it.done ? <Icon name="check" size="sm" strokeWidth={2.5} /> : null}
            </span>
            <span className={cn("min-w-0 flex-1 text-small font-medium", it.done && "text-muted-foreground line-through decoration-input")}>
              {it.done ? <span className="sr-only">Listo: </span> : null}
              {it.title}
              {it.desc ? <small className="block text-caption font-normal text-muted-foreground no-underline">{it.desc}</small> : null}
            </span>
            {!it.done && it.action ? (
              <Button size="sm" href={it.actionHref ?? "#"}>
                {it.action}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
