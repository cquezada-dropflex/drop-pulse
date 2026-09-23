import { HeaderSkeleton, LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando tus campañas">
      <HeaderSkeleton large />
      <div className="grid gap-3 px-4 md:grid-cols-2 lg:gap-4 lg:px-8 lg:py-6">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </LoadingRegion>
  );
}
