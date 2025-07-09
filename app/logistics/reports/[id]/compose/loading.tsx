export default function ComposeEmailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white px-6 py-4 flex items-center gap-4 shadow-sm border-b">
        <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Form Skeleton */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg border p-6 space-y-4">
              {/* To Field */}
              <div>
                <div className="w-8 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* CC Field */}
              <div>
                <div className="w-6 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Subject Field */}
              <div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Body Field */}
              <div>
                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="w-full h-64 bg-gray-200 rounded animate-pulse" />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <div className="w-32 h-10 bg-gray-200 rounded animate-pulse" />
                <div className="w-28 h-10 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-4">
            {/* Templates Card */}
            <div className="bg-white rounded-lg border p-4">
              <div className="w-20 h-5 bg-gray-200 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="flex gap-1">
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                      <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
                    </div>
                  </div>
                ))}
                <div className="w-full h-8 bg-gray-200 rounded animate-pulse mt-4" />
              </div>
            </div>

            {/* Report Info Card */}
            <div className="bg-white rounded-lg border p-4">
              <div className="w-24 h-5 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
