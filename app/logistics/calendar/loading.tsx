import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticsCalendarLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Calendar grid skeleton */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}

          {/* Calendar days */}
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
