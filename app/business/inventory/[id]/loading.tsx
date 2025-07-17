import { BusinessSideNavigation } from "@/components/business-side-navigation"

export default function Loading() {
  return (
    <div className="flex min-h-screen">
      <BusinessSideNavigation />
      <div className="flex-1 p-4 md:p-6 ml-0 lg:ml-64">
        <div className="mb-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm p-4">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-48 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm p-4 lg:col-span-2">
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-10 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
