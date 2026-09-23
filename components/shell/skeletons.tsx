import { cn } from "@/lib/utils";

/** Bloque de carga. Con movimiento reducido, sin pulso. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("block animate-pulse rounded-md bg-muted", className)} />;
}

/** Barra superior en carga (móvil) + encabezado de escritorio. */
export function HeaderSkeleton({ large, back }: { large?: boolean; back?: boolean }) {
  return (
    <>
      <div className={cn("flex items-center gap-3 px-4 lg:hidden", large ? "pt-3 pb-4" : "h-topbar")}>
        {back ? <Skeleton className="size-6" /> : null}
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className={large ? "h-6 w-32" : "h-5 w-44"} />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="hidden flex-col gap-2 border-b px-8 pt-6 pb-4 lg:flex">
        <Skeleton className="h-8 w-60" />
        <Skeleton className="h-3 w-40" />
      </div>
    </>
  );
}

/** Filas agrupadas (ProductRow / AttentionItem) en carga. */
export function RowsSkeleton({ rows = 3, thumb = true, className }: { rows?: number; thumb?: boolean; className?: string }) {
  return (
    <div className={cn("mx-4 overflow-hidden rounded-lg border bg-card lg:mx-0", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 not-first:border-t">
          {thumb ? <Skeleton className="size-12 rounded-sm" /> : <Skeleton className="size-9" />}
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Estado de carga anunciado a lectores de pantalla. */
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
