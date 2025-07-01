"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ChevronLeft, Menu, Search } from "lucide-react"
import { SideNavigation } from "./side-navigation"
import { TopNavigation } from "./top-navigation"
import { useResponsive } from "@/hooks/use-responsive"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

export function FixedHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isMobile } = useResponsive()
  const { user } = useAuth()
  const [isSalesOrLogisticsDashboard, setIsSalesOrLogisticsDashboard] = useState(false)

  useEffect(() => {
    setIsSalesOrLogisticsDashboard(pathname === "/sales/dashboard" || pathname === "/logistics/dashboard")
  }, [pathname])

  const getBreadcrumbs = () => {
    const pathSegments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    if (pathSegments.length === 0) {
      return [{ label: "Dashboard", href: "/dashboard" }]
    }

    let currentPath = ""
    for (let i = 0; i < pathSegments.length; i++) {
      const segment = pathSegments[i]
      currentPath += `/${segment}`
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")

      // Special handling for dynamic segments like [id]
      if (label.match(/\[.*\]/)) {
        // For now, just display the ID, or fetch a more meaningful name if available
        breadcrumbs.push({ label: pathSegments[i], href: currentPath })
      } else {
        breadcrumbs.push({ label, href: currentPath })
      }
    }
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  const showBackButton =
    (pathname.startsWith("/admin/") && pathname !== "/admin/dashboard") || isSalesOrLogisticsDashboard

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-rose-600 px-4 shrink-0 md:px-6">
      {isMobile && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0 text-white md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex flex-col">
            <SideNavigation />
          </SheetContent>
        </Sheet>
      )}

      {showBackButton && (
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 rounded-full bg-black text-white hover:bg-gray-800 hover:text-white"
          onClick={() => router.push("/admin/dashboard")}
        >
          <ChevronLeft className="h-4 w-4" />
          Admin
        </Button>
      )}

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <BreadcrumbItem key={crumb.href}>
              {index < breadcrumbs.length - 1 ? (
                <BreadcrumbLink asChild>
                  <a href={crumb.href} className="text-white hover:text-gray-200">
                    {crumb.label}
                  </a>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="font-semibold text-white">{crumb.label}</BreadcrumbPage>
              )}
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="text-white">/</BreadcrumbSeparator>}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-300" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-rose-700 pl-8 text-white placeholder:text-gray-300 focus:ring-white focus:border-white md:w-[200px] lg:w-[336px]"
        />
      </div>
      <TopNavigation />
    </header>
  )
}
