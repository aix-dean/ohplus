"use client"

import type React from "react"

import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  // If not loading and no user, redirect is handled by the page itself
  // or a higher-level auth wrapper if it existed.
  // For now, we just render children if user exists or if it's a public route.
  // The individual pages will handle their own redirects if authentication is required.

  return (
    <div className="flex min-h-screen w-full flex-col">
      <FixedHeader>
        <TopNavigation />
      </FixedHeader>
      <div className="flex flex-1 pt-[60px]">
        <SideNavigation />
        <main className={cn("flex-1 overflow-y-auto", !user && "w-full")}>
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  )
}
