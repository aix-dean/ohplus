import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="flex flex-col p-6 bg-gray-50 min-h-screen">
      <Skeleton className="h-10 w-64 mb-6" /> {/* Admin- Dashboard title */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <Skeleton className="h-8 w-72 mb-4" /> {/* Ohliver's Dashboard title */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <Skeleton className="h-10 w-full sm:max-w-sm" /> {/* Search input */}
          <Skeleton className="h-10 w-full sm:w-[180px]" /> {/* Date picker */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <Card key={i} className="w-full max-w-xs overflow-hidden rounded-lg shadow-md">
              <CardHeader className="px-4 py-3">
                <Skeleton className="h-6 w-3/4" /> {/* Card Title */}
              </CardHeader>
              <CardContent className="p-4">
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-4 w-1/2" /> {/* Member 1 */}
                  <Skeleton className="h-4 w-1/2" /> {/* Member 2 */}
                </div>
                <Skeleton className="h-4 w-3/4 mt-2" /> {/* Metric */}
                <Skeleton className="h-10 w-full mt-4" /> {/* Add Widget Button */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
