import type React from "react"
import { Loader2 } from "lucide-react"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>{children}</div>
}

function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
}

function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>
}

export default function Loading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Title and Badges Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left - Image Skeleton */}
        <div className="col-span-2">
          <div className="bg-gray-100 rounded-lg p-4">
            <Skeleton className="w-full aspect-square rounded" />
          </div>
        </div>

        {/* Middle - Description and CMS Config Skeleton */}
        <div className="col-span-6 space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>

          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Right - ID and Dimensions Skeleton */}
        <div className="col-span-4 space-y-4">
          <div>
            <Skeleton className="h-4 w-8 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>

          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="space-y-4">
        <div className="grid w-full grid-cols-4 gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Tab Content Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="grid grid-cols-7 gap-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading indicator */}
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading site details...</span>
      </div>
    </div>
  )
}
