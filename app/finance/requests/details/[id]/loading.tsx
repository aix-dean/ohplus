import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function RequestDetailsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div>
            <div className="h-8 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 mt-2 animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded w-20 animate-pulse" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                </div>
                {i < 5 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Request Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-muted rounded animate-pulse" />
              <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="h-4 bg-muted rounded w-24 animate-pulse mb-2" />
              <div className="h-16 bg-muted rounded animate-pulse" />
            </div>
            <Separator />
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                </div>
                {i < 3 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Attachments Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
          </div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  <div>
                    <div className="h-4 bg-muted rounded w-32 animate-pulse mb-2" />
                    <div className="h-3 bg-muted rounded w-24 animate-pulse mb-1" />
                    <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-8 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-8 bg-muted rounded w-16 animate-pulse" />
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="h-48 bg-muted rounded animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
