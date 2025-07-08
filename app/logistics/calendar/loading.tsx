export default function Loading() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="w-48 h-8 bg-gray-300 rounded animate-pulse mb-2"></div>
        <div className="w-64 h-5 bg-gray-300 rounded animate-pulse"></div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-32 h-8 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="w-32 h-10 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="grid grid-cols-7 rounded-t-md">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 border-r border-gray-200">
              <div className="w-16 h-4 bg-gray-300 rounded animate-pulse mx-auto"></div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border border-gray-200">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="min-h-[100px] p-2 border-r border-b border-gray-200">
              <div className="w-6 h-4 bg-gray-300 rounded animate-pulse mb-2"></div>
              {Math.random() > 0.7 && <div className="w-full h-6 bg-gray-300 rounded animate-pulse"></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
