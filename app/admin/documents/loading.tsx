import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col h-full p-4">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Tabs and Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="flex gap-2 ml-auto">
          <Skeleton className="h-10 w-36 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 w-full max-w-md">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>

      {/* Content Area - Empty State */}
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Skeleton className="h-6 w-48 mb-2 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    </div>
  )
}
