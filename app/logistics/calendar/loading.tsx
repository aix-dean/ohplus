export default function Loading() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-8 bg-gray-200 rounded"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
            <div className="h-8 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 bg-gray-50">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="p-3 border-r border-gray-200 last:border-r-0">
                <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
              </div>
            ))}
          </div>

          {/* Calendar days skeleton */}
          <div className="grid grid-cols-7">
            {Array.from({ length: 35 }).map((_, index) => (
              <div key={index} className="h-32 border border-gray-200 p-2">
                <div className="h-4 bg-gray-200 rounded w-6 mb-2"></div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
