import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 bg-muted rounded w-40 animate-pulse" />
          <div className="h-4 bg-muted rounded w-64 mt-2 animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-muted rounded animate-pulse" />
      </div>

      <div className="h-10 w-full bg-muted rounded animate-pulse" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <span className="h-4 w-24 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-muted rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />
            <span className="h-4 w-24 bg-muted rounded animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-muted rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
