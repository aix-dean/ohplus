import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewInventoryItemLoading() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center space-x-4 mb-6">
        <Skeleton className="h-9 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Stepper Skeleton */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="mt-2 text-center space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-24 hidden md:block" />
                </div>
              </div>
              {index < 4 && <Skeleton className="flex-1 h-0.5 mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content Skeleton */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Buttons Skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )
}
