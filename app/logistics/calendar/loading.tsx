import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-40" />
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-gray-50">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3 text-center border-r border-gray-200 last:border-r-0">
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>

          {/* Calendar days skeleton */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[120px] border border-gray-200 p-2">
                <Skeleton className="h-4 w-6 mb-2" />
                <div className="space-y-1">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
