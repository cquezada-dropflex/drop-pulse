import { LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando el precio">
      <div className="flex h-topbar items-center gap-3 px-4 lg:hidden">
        <Skeleton className="size-6" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="flex flex-col gap-4 px-4 lg:grid lg:max-w-240 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-6">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="aspect-4/3" />
      </div>
    </LoadingRegion>
  );
}
