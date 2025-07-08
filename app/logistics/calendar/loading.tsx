import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticsCalendarLoading() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-gray-50">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="p-4 text-center border-r border-gray-200 last:border-r-0">
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {Array.from({ length: 35 }, (_, i) => (
            <div key={i} className="min-h-[120px] border border-gray-200 p-2">
              <Skeleton className="h-4 w-6 mb-2" />
              <div className="space-y-1">
                <Skeleton className="h-6 w-full" />
                {Math.random() > 0.7 && <Skeleton className="h-6 w-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
