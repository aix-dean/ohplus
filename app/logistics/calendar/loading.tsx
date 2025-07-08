import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticsCalendarLoading() {
  return (
    <div className="p-6 bg-white">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-32" />
          </div>
          <div className="flex items-center space-x-3">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-7 border-2 border-gray-200 rounded-md">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-12 border-r border-gray-200" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 border border-gray-200 rounded-md overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-[120px] p-2 border-r border-b border-gray-200">
            <Skeleton className="h-4 w-6 mb-2" />
            <div className="space-y-1">
              {Math.random() > 0.7 && <Skeleton className="h-6 w-full" />}
              {Math.random() > 0.8 && <Skeleton className="h-6 w-full" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
