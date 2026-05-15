import { Skeleton } from "@/components/ui/skeleton";
import SkeletonGrid from "@/components/shared/SkeletonGrid";

export default function HomeLoading() {
  return (
    <div className="space-y-16">
      {/* Hero skeleton */}
      <Skeleton className="w-full h-[420px] rounded-3xl" />
      {/* Features strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {/* Categories */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-32" />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
      {/* Products */}
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <SkeletonGrid count={8} />
      </div>
    </div>
  );
}
