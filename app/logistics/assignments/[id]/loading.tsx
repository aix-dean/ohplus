export default function Loading() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-md animate-pulse" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column skeleton */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Project Information skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />

              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Right Column skeleton */}
          <div className="space-y-6">
            {/* Project Details skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>

            {/* Attachments skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-36 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Status Tracker skeleton */}
            <div className="border rounded-lg p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="text-center space-y-2">
                <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse mx-auto" />
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mx-auto" />
              </div>
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
