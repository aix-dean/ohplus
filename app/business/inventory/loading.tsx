import { BusinessSideNavigation } from "@/components/business-side-navigation"

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <BusinessSideNavigation />
      <div className="flex-1 p-4 md:p-6 ml-0 lg:ml-64">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="h-48 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
