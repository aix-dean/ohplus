export default function CMSSiteDetailsLoading() {
  return (
    <div className="flex-1 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-9 w-32 bg-muted animate-pulse rounded" />
            <div>
              <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 bg-muted animate-pulse rounded" />
            <div className="h-9 w-9 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Site Preview Card */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="aspect-video bg-muted animate-pulse rounded-lg mb-4" />
              <div className="space-y-2">
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="border rounded-lg p-6">
              <div className="h-6 w-48 bg-muted animate-pulse rounded mb-4" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* CMS Schedule */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div>
                      <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
                      <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Location & Operation */}
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-5 w-5 bg-muted animate-pulse rounded" />
                <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded mb-1" />
                    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Site Status */}
            <div className="border rounded-lg p-6">
              <div className="h-6 w-24 bg-muted animate-pulse rounded mb-4" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-12 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-px bg-muted" />
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      <div>
                        <div className="h-4 w-16 bg-muted animate-pulse rounded mb-1" />
                        <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border rounded-lg p-6">
              <div className="h-6 w-28 bg-muted animate-pulse rounded mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-full bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
