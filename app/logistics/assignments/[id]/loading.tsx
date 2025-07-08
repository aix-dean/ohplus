export default function ServiceAssignmentDetailsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-slate-800 text-white p-4">
        <div className="h-6 bg-slate-700 rounded w-48 animate-pulse"></div>
      </div>

      <div className="flex">
        {/* Left Sidebar */}
        <div className="w-64 bg-white border-r min-h-screen p-4 space-y-4">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
