import { LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando el producto">
      <div className="flex h-topbar items-center gap-3 px-4 lg:hidden">
        <Skeleton className="size-6" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="flex flex-col gap-1 px-4 py-3 lg:max-w-content lg:px-8 lg:py-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-start gap-3 py-3">
            <Skeleton className="size-7 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </LoadingRegion>
  );
}
