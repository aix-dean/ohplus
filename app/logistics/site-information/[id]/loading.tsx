export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="flex items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-24 h-5 bg-gray-300 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-20 h-5 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="w-32 h-6 bg-gray-300 rounded animate-pulse"></div>
              <div className="space-y-3">
                <div className="w-12 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gray-300 rounded animate-pulse"></div>
                    <div className="w-32 h-5 bg-gray-300 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column */}
          <div className="col-span-4 space-y-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
                <div className="w-20 h-4 bg-gray-300 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="col-span-4">
            <div className="text-right space-y-4">
              <div className="w-24 h-6 bg-gray-300 rounded animate-pulse ml-auto"></div>
              <div className="space-y-2">
                <div className="w-16 h-4 bg-gray-300 rounded animate-pulse ml-auto"></div>
                <div className="w-32 h-4 bg-gray-300 rounded animate-pulse ml-auto"></div>
              </div>
              <div className="w-32 h-10 bg-gray-300 rounded animate-pulse ml-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
