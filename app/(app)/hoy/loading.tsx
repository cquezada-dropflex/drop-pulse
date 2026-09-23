import { HeaderSkeleton, LoadingRegion, RowsSkeleton, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando lo que te toca decidir">
      <HeaderSkeleton large />
      <div className="flex flex-col gap-4 lg:max-w-content lg:px-8 lg:py-6">
        <div className="flex gap-2 px-4 lg:px-0">
          <Skeleton className="h-15 flex-1" />
          <Skeleton className="h-15 flex-1" />
          <Skeleton className="h-15 flex-1" />
        </div>
        <RowsSkeleton rows={3} thumb={false} />
        <RowsSkeleton rows={2} thumb={false} />
      </div>
    </LoadingRegion>
  );
}
