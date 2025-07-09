import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function ComposeEmailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-sm border-b">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email Compose Form */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6 space-y-4">
                {/* To Field */}
                <div>
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* CC Field */}
                <div>
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Subject Field */}
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Body Field */}
                <div>
                  <Skeleton className="h-4 w-16 mb-1" />
                  <Skeleton className="h-[300px] w-full" />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Templates Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-20 mb-4" />
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <div className="flex items-center gap-1">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-full" />
                      </div>
                    </div>
                  ))}
                  <Skeleton className="h-8 w-full mt-4" />
                </div>
              </CardContent>
            </Card>

            {/* Report Info */}
            <Card>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-24 mb-2" />
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-20" />
                    </div>
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
