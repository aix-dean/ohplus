export default function LogisticsCalendarLoading() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-6">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Calendar controls skeleton */}
        <div className="border rounded-lg p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Navigation controls skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse ml-2"></div>
            </div>

            {/* Search and filter controls skeleton */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>

              {/* View controls skeleton */}
              <div className="flex items-center justify-between gap-2">
                <div className="h-10 w-80 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center gap-1">
                  <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-10 w-10 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="bg-white border rounded-lg p-2 sm:p-4 overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Calendar header skeleton */}
            <div className="grid grid-cols-7 gap-1 mt-4">
              {Array(7)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="text-center p-1 sm:p-2">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse mx-auto"></div>
                  </div>
                ))}
            </div>

            {/* Calendar body skeleton */}
            <div className="grid grid-cols-7 gap-1 mt-2">
              {Array(35)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="min-h-[80px] sm:min-h-[120px] border rounded-md p-1 bg-white border-gray-200">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse ml-auto mb-2"></div>
                    <div className="space-y-1">
                      <div className="h-6 w-full bg-gray-100 rounded animate-pulse"></div>
                      <div className="h-6 w-3/4 bg-gray-100 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
