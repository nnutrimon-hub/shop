import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  count?: number;
}

export default function SkeletonGrid({ count = 8 }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden border">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-9 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
