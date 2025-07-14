"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { Skeleton } from "@/components/ui/skeleton"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    console.log("CMS Layout - Auth state:", { user: !!user, loading, isAdmin, adminLoading })

    if (loading || adminLoading) {
      console.log("CMS Layout - Still loading auth state")
      return
    }

    if (!user) {
      console.log("CMS Layout - No user, redirecting to login")
      router.push("/login")
      return
    }

    if (!isAdmin) {
      console.log("CMS Layout - User is not admin, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    console.log("CMS Layout - User is admin, allowing access")
    setIsChecking(false)
  }, [user, loading, isAdmin, adminLoading, router])

  if (loading || adminLoading || isChecking) {
    console.log("CMS Layout - Showing loading skeleton")
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-100 p-4">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    console.log("CMS Layout - Access denied, not rendering children")
    return null
  }

  console.log("CMS Layout - Rendering CMS content")
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
