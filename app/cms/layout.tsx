"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useIsAdmin } from "@/hooks/use-is-admin"
import SideNavigation from "@/components/side-navigation"
import TopNavigation from "@/components/top-navigation"
import { Skeleton } from "@/components/ui/skeleton"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const { isAdmin, loading: adminLoading } = useIsAdmin()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    console.log("CMS Layout: Auth state changed", {
      user: !!user,
      isAdmin,
      authLoading,
      adminLoading,
      isClient,
    })

    if (!authLoading && !adminLoading && isClient) {
      if (!user) {
        console.log("CMS Layout: No user, redirecting to login")
        router.push("/login")
        return
      }

      if (!isAdmin) {
        console.log("CMS Layout: User is not admin, redirecting to dashboard")
        router.push("/dashboard")
        return
      }

      console.log("CMS Layout: User authenticated and is admin, rendering content")
    }
  }, [user, isAdmin, authLoading, adminLoading, router, isClient])

  // Show loading while checking authentication
  if (authLoading || adminLoading || !isClient) {
    console.log("CMS Layout: Showing loading state", {
      authLoading,
      adminLoading,
      isClient,
    })
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <div className="w-64 bg-white shadow-sm">
            <div className="p-4">
              <Skeleton className="h-8 w-32 mb-4" />
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white shadow-sm">
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render children if user is not authenticated or not admin
  if (!user || !isAdmin) {
    console.log("CMS Layout: User not authenticated or not admin, not rendering children")
    return null
  }

  console.log("CMS Layout: Rendering authenticated admin content")
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <SideNavigation />
        <div className="flex-1">
          <TopNavigation />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
