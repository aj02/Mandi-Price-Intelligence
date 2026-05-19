import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[78rem] px-4 py-12 md:px-6">
      <Skeleton className="h-6 w-40 rounded-full" />
      <Skeleton className="mt-4 h-16 w-3/4 max-w-xl rounded-md" />
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
