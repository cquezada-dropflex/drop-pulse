import { HeaderSkeleton, LoadingRegion, Skeleton } from "@/components/shell/skeletons";

export default function Loading() {
  return (
    <LoadingRegion label="Cargando la campaña">
      <HeaderSkeleton back />
      <div className="flex flex-col gap-4 px-4 py-2 lg:max-w-content lg:px-8 lg:py-6">
        <Skeleton className="h-20" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    </LoadingRegion>
  );
}
