import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function LogisticsCalendarLoading() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-10" />
          </div>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="p-3 text-center bg-gray-50 border-r border-gray-200">
                  <Skeleton className="h-4 w-16 mx-auto" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 border-r border-b border-gray-200 p-1">
                  <Skeleton className="h-4 w-6 mb-1" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
