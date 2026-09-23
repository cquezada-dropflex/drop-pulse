import { LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando las imágenes">
      <div className="flex h-topbar items-center gap-3 px-4 lg:hidden">
        <Skeleton className="size-6" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex flex-col gap-3 px-4 lg:max-w-240 lg:px-8 lg:py-6">
        <Skeleton className="h-9.5 w-full lg:max-w-md" />
        <div className="grid grid-cols-3 gap-2 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </LoadingRegion>
  );
}
