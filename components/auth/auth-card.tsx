import { cn } from "@/lib/utils";

/** Encabezado + contenido de una pantalla de acceso. */
export function AuthCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-title md:text-display">{title}</h1>
        {description ? <p className="text-body text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Mensaje de error de un formulario: qué pasó y qué hacer. */
export function FormError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-md bg-destructive-soft p-3 text-label font-normal text-destructive">
      {children}
    </p>
  );
}

export const linkClass = "text-primary underline underline-offset-4 hover:no-underline";
