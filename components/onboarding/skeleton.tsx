import { LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export function StepSkeleton() {
  return (
    <LoadingRegion label="Cargando el paso">
      <div className="flex flex-col gap-3 px-4 pt-4 lg:px-12 lg:pt-12">
        <Skeleton className="mx-auto h-4 w-20 lg:hidden" />
        <Skeleton className="h-1.5 w-full rounded-full lg:hidden" />
        <Skeleton className="h-7 w-2/3 lg:h-9 lg:w-96" />
        <Skeleton className="h-4 w-full lg:w-120" />
        <Skeleton className="mt-4 h-40 w-full lg:max-w-content" />
        <Skeleton className="h-28 w-full lg:max-w-content" />
      </div>
    </LoadingRegion>
  );
}
