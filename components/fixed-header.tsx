"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Bell, Search, Settings, LogOut, User } from "lucide-react"

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

interface FixedHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onMenuClick: () => void
}

export function FixedHeader({ onMenuClick, className, ...props }: FixedHeaderProps) {
  const { user, userData, signOut } = useAuth()
  const { unreadCount } = useUnreadMessages()
  const isAdmin = useIsAdmin()
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard" // Default for root

    // Handle specific known paths
    if (path === "/sales/dashboard") return "Sales - Dashboard"
    if (path === "/logistics/dashboard") return "Logistics - Dashboard"
    if (path === "/cms/dashboard") return "CMS - Dashboard"
    if (path === "/admin/dashboard") return "Admin - Dashboard"
    if (path === "/ai-assistant") return "AI Assistant"
    if (path === "/account") return "Account Settings"
    if (path === "/settings") return "Settings"
    if (path === "/settings/subscription") return "Settings - Subscription"
    if (path === "/help") return "Help & Support"
    if (path === "/features") return "Features"

    // Handle dynamic paths and general structure
    if (segments[0]) {
      const section = segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
      let page = ""

      if (segments.length > 1) {
        page = segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
        // Special handling for common patterns like [id] or edit/[id]
        if (segments.length > 2 && segments[2].match(/\[.*\]/)) {
          page = segments[1].charAt(0).toUpperCase() + segments[1].slice(1) // Keep parent name
        } else if (segments.length > 2 && segments[1] === "edit" && segments[2].match(/\[.*\]/)) {
          page = `Edit ${segments[0].slice(0, -1)}` // e.g., Sales - Edit Product
        } else if (segments.length > 2 && segments[1] === "create") {
          page = `Create ${segments[0].slice(0, -1)}` // e.g., Admin - Create Product
        } else if (segments.length > 2 && segments[1] === "new") {
          page = `New ${segments[0].slice(0, -1)}` // e.g., Sales - New Product
        } else if (segments.length > 2 && segments[1] === "view") {
          page = `View ${segments[0].slice(0, -1)}` // e.g., Proposals - View Proposal
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

        // Capitalize and replace hyphens for readability
        page = page
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      }

      if (page) {
        return `${section} - ${page}`
      }
      return section
    }
    return "Dashboard"
  }

  const pageTitle = getPageTitle(pathname)

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent",
        className,
      )}
      {...props}
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          {/* Mobile navigation content would go here, if needed */}
        </SheetContent>
      </Sheet>
      <h1 className="text-lg font-semibold md:text-xl">{pageTitle}</h1>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
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
          <Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
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
              <Link href="/admin">
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
