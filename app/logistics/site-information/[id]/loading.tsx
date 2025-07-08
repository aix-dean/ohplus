import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticSiteInformationLoading() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Skeleton className="h-6 w-40" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="col-span-4 space-y-6">
          {/* Service Type and Tagged to */}
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-36" />

            <div>
              <Skeleton className="h-4 w-12 mb-2" />
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="bg-gray-50 border border-gray-200 rounded p-3">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          {/* Requested By */}
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Middle Column */}
        <div className="col-span-4 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <div className="pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4 space-y-4">
          <div className="text-right">
            <Skeleton className="h-5 w-28 ml-auto" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-16 ml-auto" />
              <Skeleton className="h-4 w-32 ml-auto" />
            </div>
            <div className="mt-6">
              <Skeleton className="h-10 w-36 ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
