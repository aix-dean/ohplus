import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticsJobOrdersLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
      </div>

      {/* Search Bar Skeleton */}
      <div className="max-w-md">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-lg border">
        <div className="p-4">
          {/* Table Header */}
          <div className="grid grid-cols-8 gap-4 mb-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid grid-cols-8 gap-4 mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Button Skeleton */}
      <div className="fixed bottom-6 right-6">
        <Skeleton className="h-12 w-24 rounded-full" />
      </div>
    </div>
  )
}
