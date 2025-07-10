import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SiteDetailsLoading() {
  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" className="flex items-center gap-2" disabled>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>

      {/* Site Information Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex gap-6">
            <Skeleton className="w-32 h-24 flex-shrink-0" />
            <div className="flex-1 space-y-3">
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project Monitoring */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <Skeleton className="h-6 w-40 bg-white/20" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="text-left py-3 px-4">
                    <Skeleton className="h-4 w-12" />
                  </th>
                  <th className="text-left py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="text-left py-3 px-4">
                    <Skeleton className="h-4 w-16" />
                  </th>
                  <th className="text-left py-3 px-4">
                    <Skeleton className="h-4 w-20" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array(7)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-48" />
                      </td>
                      <td className="py-3 px-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
