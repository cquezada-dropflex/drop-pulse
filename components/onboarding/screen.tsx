import { OnboardingHeader, type OnboardingHeaderProps } from "@/components/df";
import { cn } from "@/lib/utils";

/**
 * Marco de un paso. Móvil: OnboardingHeader arriba (sin pestañas) y la acción en la barra fija.
 * Escritorio: título en type-display con su descripción, contenido con ancho máximo size-content
 * y pie fijo con el resumen y las acciones a la derecha.
 */
export function OnboardingScreen({
  header,
  title,
  desc,
  deskTitle,
  deskDesc,
  deskAside,
  children,
  footer,
  bodyClassName,
  hideHeader,
}: {
  header?: Omit<OnboardingHeaderProps, "title" | "desc">;
  title: string;
  desc?: string;
  deskTitle?: string;
  deskDesc?: string;
  /** A la derecha del título en escritorio (p. ej., el filtro Recomendados · Todos). */
  deskAside?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
  /** Sin encabezado de paso (pantalla final). */
  hideHeader?: boolean;
}) {
  return (
    <div className="flex min-h-svh flex-1 flex-col">
      {!hideHeader && header ? (
        <div className="lg:hidden">
          <OnboardingHeader {...header} title={title} desc={desc} />
        </div>
      ) : null}
      <header className={cn("hidden items-end gap-4 px-12 pt-12 pb-6 lg:flex", hideHeader && "lg:hidden")}>
        <div className="min-w-0 flex-1">
          <h1 className="text-display">{deskTitle ?? title}</h1>
          {(deskDesc ?? desc) ? <p className="mt-1 text-body text-muted-foreground">{deskDesc ?? desc}</p> : null}
        </div>
        {deskAside}
      </header>
      <div className={cn("flex flex-col gap-5 p-4 lg:max-w-[calc(var(--size-content)+var(--space-12)*2)] lg:px-12 lg:pt-0 lg:pb-8", bodyClassName)}>
        {children}
      </div>
      {footer}
    </div>
  );
}
