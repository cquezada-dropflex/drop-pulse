import { IconButton, TopBar } from "@/components/df";
import { cn } from "@/lib/utils";

/**
 * Encabezado de pantalla. Móvil: TopBar (grande en las raíces de pestaña). Escritorio (≥lg):
 * título en type-display con su subtítulo y las acciones a la derecha (.df-desk-head).
 */
export function PageHeader({
  title,
  subtitle,
  back,
  backHref,
  actions,
  desktopActions,
  desktopSubtitle,
  large,
  className,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  backHref?: string;
  /** Acciones de la TopBar en móvil (y en escritorio si no hay `desktopActions`). */
  actions?: React.ReactNode;
  desktopActions?: React.ReactNode;
  /** Subtítulo más completo en escritorio. */
  desktopSubtitle?: string;
  large?: boolean;
  className?: string;
}) {
  return (
    <>
      <TopBar
        title={title}
        subtitle={subtitle}
        back={back}
        backHref={backHref}
        actions={actions}
        large={large}
        className={cn("sticky top-0 z-sticky pt-[env(safe-area-inset-top)] lg:hidden", large && "pt-2", className)}
      />
      <header className="hidden items-center gap-3 border-b px-8 pt-5 pb-4 lg:flex">
        {back ? <IconButton icon="chevron-left" label={back} href={backHref} /> : null}
        <div className="min-w-0 flex-1">
          <h1 className="text-display">{title}</h1>
          {desktopSubtitle ?? subtitle ? <p className="text-caption text-muted-foreground">{desktopSubtitle ?? subtitle}</p> : null}
        </div>
        {desktopActions === undefined ? actions : desktopActions}
      </header>
    </>
  );
}

/** Título de sección (.df-section-t). */
export function SectionTitle({ children, end, className }: { children: React.ReactNode; end?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between px-4 pt-4 pb-2 lg:px-0", className)}>
      <h2 className="text-label font-semibold text-muted-foreground">{children}</h2>
      {end}
    </div>
  );
}

/** Grupo de filas con borde (.df-group). */
export function Group({ children, className, label }: { children: React.ReactNode; className?: string; label?: string }) {
  return (
    <div aria-label={label} className={cn("mx-4 overflow-hidden rounded-lg border bg-card lg:mx-0", className)}>
      {children}
    </div>
  );
}

/** Estado vacío: qué pasa y qué hacer. */
export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      {icon ? <span className="mb-1 grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</span> : null}
      <h2 className="text-heading">{title}</h2>
      {children ? <p className="max-w-sm text-body text-muted-foreground">{children}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
