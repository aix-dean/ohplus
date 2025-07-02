"use client"

import React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, Search, Settings, LogOut, User, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

interface FixedHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onMenuClick: () => void
}

interface BreadcrumbItemData {
  label: string
  href?: string
  isPage?: boolean
}

export function FixedHeader({ onMenuClick, className, ...props }: FixedHeaderProps) {
  const pathname = usePathname()
  const { user, userData, signOut } = useAuth()
  const { unreadCount } = useUnreadMessages()
  const isAdmin = useIsAdmin()

  // --- Debugging Logs ---
  console.log("Current Pathname:", pathname)
  const isAdminPage = pathname.startsWith("/admin")
  console.log("Is Admin Page:", isAdminPage)
  // --- End Debugging Logs ---

  const getBreadcrumbs = (path: string): BreadcrumbItemData[] => {
    const segments = path.split("/").filter(Boolean)
    const breadcrumbs: BreadcrumbItemData[] = []

    if (path === "/admin/dashboard") {
      breadcrumbs.push({ label: "Admin - Dashboard", isPage: true })
    } else if (path.startsWith("/admin/")) {
      breadcrumbs.push({ label: "Admin - Dashboard", href: "/admin/dashboard" })
      const adminSubPath = segments[1]
      if (adminSubPath) {
        const pageLabel = adminSubPath
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
        breadcrumbs.push({ label: pageLabel, isPage: true })
      }
    } else if (path.startsWith("/sales/dashboard")) {
      breadcrumbs.push({ label: "Admin - Dashboard", href: "/admin/dashboard" })
      breadcrumbs.push({ label: "Sales - Dashboard", isPage: true })
    } else if (path.startsWith("/logistics/dashboard")) {
      breadcrumbs.push({ label: "Admin - Dashboard", href: "/admin/dashboard" })
      breadcrumbs.push({ label: "Logistics - Dashboard", isPage: true })
    } else if (segments.length === 0) {
      breadcrumbs.push({ label: "Dashboard", isPage: true })
    } else {
      // General handling for other paths
      const section = segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
      let page = ""

      if (segments.length > 1) {
        page = segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
        if (segments.length > 2 && segments[2].match(/\[.*\]/)) {
          page = segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
        } else if (segments.length > 2 && segments[1] === "edit" && segments[2].match(/\[.*\]/)) {
          page = `Edit ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "create") {
          page = `Create ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "new") {
          page = `New ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "view") {
          page = `View ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "cost-estimates") {
          page = `Cost Estimates`
        } else if (segments.length > 2 && segments[1] === "generate-quotation") {
          page = `Generate Quotation`
        } else if (segments.length > 2 && segments[1] === "create-cost-estimate") {
          page = `Create Cost Estimate`
        } else if (segments.length > 2 && segments[1] === "accept") {
          page = `Accept Quotation`
        } else if (segments.length > 2 && segments[1] === "decline") {
          page = `Decline Quotation`
        } else if (segments.length > 2 && segments[1] === "chat") {
          page = `Chat`
        } else if (segments.length > 2 && segments[1] === "bulletin-board") {
          page = `Bulletin Board`
        } else if (segments.length > 2 && segments[1] === "project-campaigns") {
          page = `Project Campaigns`
        } else if (segments.length > 2 && segments[1] === "quotation-requests") {
          page = `Quotation Requests`
        } else if (segments.length > 2 && segments[1] === "bookings") {
          page = `Bookings`
        } else if (segments.length > 2 && segments[1] === "alerts") {
          page = `Alerts`
        } else if (segments.length > 2 && segments[1] === "assignments") {
          page = `Assignments`
        } else if (segments.length > 2 && segments[1] === "planner") {
          page = `Planner`
        } else if (segments.length > 2 && segments[1] === "access-management") {
          page = `Access Management`
        } else if (segments.length > 2 && segments[1] === "chat-analytics") {
          page = `Chat Analytics`
        }

        page = page
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      }

      if (page) {
        breadcrumbs.push({ label: section, href: `/${segments[0]}` })
        breadcrumbs.push({ label: page, isPage: true })
      } else {
        breadcrumbs.push({ label: section, isPage: true })
      }
    }
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  const showAdminBackButton =
    (pathname.startsWith("/admin/") && pathname !== "/admin/dashboard") ||
    pathname.startsWith("/sales/dashboard") ||
    pathname.startsWith("/logistics/dashboard")

  return (
    
  )
}
