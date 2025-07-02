import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-10">
      <Skeleton className="h-10 w-1/4 mb-6" />

      <div className="grid gap-8">
        <div>
          <Skeleton className="h-8 w-1/6 mb-4" />
          <div className="grid gap-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        <div>
          <Skeleton className="h-8 w-1/6 mb-4" />
          <div className="grid gap-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        <div>
          <Skeleton className="h-8 w-1/6 mb-4" />
          <div className="grid gap-4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
