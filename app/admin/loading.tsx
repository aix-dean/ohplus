import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        {/* Fixed Header Skeleton */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Skeleton className="h-8 w-8 rounded-full sm:hidden" />
          <Skeleton className="h-8 w-48 hidden sm:block" />
          <Skeleton className="ml-auto h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </header>

        {/* Main Content Area Skeleton */}
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid w-full flex-1 auto-rows-max gap-8">
            {/* Page Header Skeleton */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-64" />
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid gap-8 md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_400px]">
              <div className="grid auto-rows-max items-start gap-8">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[200px] w-full" />
              </div>
              <div className="grid auto-rows-max items-start gap-8">
                <Skeleton className="h-[250px] w-full" />
                <Skeleton className="h-[180px] w-full" />
              </div>
            </div>

            {/* Mobile Buttons Skeleton */}
            <div className="flex items-center justify-center gap-2 md:hidden">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
