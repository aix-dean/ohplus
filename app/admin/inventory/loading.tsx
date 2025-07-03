import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </header>
      <main className="flex-1 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </main>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm flex flex-col">
      <Skeleton className="aspect-video w-full rounded-t-lg" />
      <div className="p-4 space-y-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="p-4 border-t">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
