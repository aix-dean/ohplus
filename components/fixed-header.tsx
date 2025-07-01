"use client"

import React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
import { SideNavigation } from "./side-navigation" // Assuming this exists for mobile sheet

interface FixedHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onMenuClick?: () => void // Made optional as it's not always passed
}

interface BreadcrumbItemData {
  label: string
  href?: string
  isPage?: boolean
}

export function FixedHeader({ onMenuClick, className, ...props }: FixedHeaderProps) {
  const { user, userData, signOut } = useAuth()
  const { unreadCount } = useUnreadMessages()
  const isAdmin = useIsAdmin()
  const pathname = usePathname()
  const router = useRouter()

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

  const isAdminPage = pathname.startsWith("/admin/")

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b-0 px-4 sm:static sm:h-auto",
        isAdminPage ? "bg-[#5B3B9B]" : "bg-rose-600", // Conditional background color
        className,
      )}
      {...props}
    >
      {/* New: Back button for admin sub-pages, sales dashboard, and logistics dashboard */}
      {showAdminBackButton && (
        <Button
          variant="default"
          className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-white hover:bg-black/90"
          onClick={() => router.push("/admin/dashboard")} // Use router.push for navigation
        >
          <ChevronLeft className="h-4 w-4" /> Admin
        </Button>
      )}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="bg-transparent sm:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          {/* Mobile navigation content would go here, if needed */}
          <SideNavigation /> {/* Assuming SideNavigation is for mobile */}
        </SheetContent>
      </Sheet>
      {/* Replaced h1 with Breadcrumb component */}
      <Breadcrumb>
        <BreadcrumbList className="text-white">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.label === "Admin - Dashboard" && item.href && !showAdminBackButton ? (
                  <Link href={item.href} passHref>
                    <Button
                      variant="default"
                      className="flex items-center gap-1 rounded-full bg-black px-4 py-2 text-white hover:bg-black/90"
                      asChild
                    >
                      <span>
                        <ChevronLeft className="h-4 w-4" /> Admin
                      </span>
                    </Button>
                  </Link>
                ) : item.isPage ? (
                  <BreadcrumbPage className="font-normal text-white">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href || "#"} className="text-white transition-colors hover:text-gray-200">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator className="text-white" />}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white" />
        <Input
          type="search"
          placeholder="Search..."
          className={cn(
            "w-full rounded-lg pl-8 md:w-[200px] lg:w-[336px]",
            isAdminPage
              ? "bg-[#7A5BBF] placeholder:text-gray-200 text-white" // Adjusted for purple header
              : "bg-gray-700 placeholder:text-gray-300 text-white", // Original for rose header
          )}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full text-white hover:bg-rose-500">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>No new notifications</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="overflow-hidden rounded-full text-white hover:bg-rose-500">
            <Avatar>
              <AvatarImage src={user?.photoURL || "/placeholder-user.jpg"} alt="User Avatar" />
              <AvatarFallback>
                {userData?.first_name ? userData.first_name.charAt(0) : user?.email?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">User Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {userData?.first_name && userData?.last_name
              ? `${userData.first_name} ${userData.last_name}`
              : user?.email || "My Account"}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account">
              <User className="mr-2 h-4 w-4" />
              Account
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin/dashboard">
                {" "}
                {/* Updated link to admin dashboard */}
                <Settings className="mr-2 h-4 w-4" />
                Admin
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
