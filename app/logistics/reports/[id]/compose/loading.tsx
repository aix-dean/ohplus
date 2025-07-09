import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ComposeEmailLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Compose Area */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* To Field */}
                <div>
                  <Skeleton className="h-4 w-8 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* CC Field */}
                <div>
                  <Skeleton className="h-4 w-8 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Subject Field */}
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Body Field */}
                <div>
                  <Skeleton className="h-48 w-full" />
                </div>

                {/* Attachment */}
                <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-12" />
                </div>

                {/* Send Button */}
                <div className="flex justify-end pt-4">
                  <Skeleton className="h-10 w-32" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Templates */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 rounded-lg border bg-gray-50">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                ))}
                <Skeleton className="h-8 w-full mt-2" />
              </CardContent>
            </Card>

            {/* Debug Info */}
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-20" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-3 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
