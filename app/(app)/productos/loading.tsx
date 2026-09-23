import { HeaderSkeleton, LoadingRegion, RowsSkeleton, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando tus productos">
      <HeaderSkeleton large />
      <div className="flex flex-col gap-3 lg:max-w-content lg:px-8 lg:py-6">
        <div className="px-4 lg:px-0">
          <Skeleton className="h-9.5 w-full lg:w-96" />
        </div>
        <RowsSkeleton rows={4} />
      </div>
    </LoadingRegion>
  );
}
