import { Skeleton } from "@/components/ui/skeleton"

export default function LogisticSiteInformationLoading() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Skeleton className="h-6 w-40" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-4 space-y-6">
          {/* Service Type and Tagged to */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />

            {/* Site */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-3">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="bg-gray-100 rounded-lg p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          </div>

          {/* Requested By */}
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Middle Column */}
        <div className="col-span-4 space-y-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}

          <div className="space-y-2 pt-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-4">
          <div className="space-y-4">
            <Skeleton className="h-6 w-28" />

            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-32" />
            </div>

            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
