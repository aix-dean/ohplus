import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticsCalendarLoading() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
