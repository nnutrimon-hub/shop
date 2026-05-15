import { Skeleton } from "@/components/ui/skeleton";
import SkeletonGrid from "@/components/shared/SkeletonGrid";

export default function ProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>
      <SkeletonGrid count={12} />
    </div>
  );
}
