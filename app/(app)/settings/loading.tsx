import { HeaderSkeleton, LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando tus ajustes">
      <HeaderSkeleton large />
      <div className="flex flex-col gap-4 px-4 lg:max-w-content lg:px-8 lg:py-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </LoadingRegion>
  );
}
