"use client"

import type React from "react"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { ArrowLeft, Bell, Menu, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SideNavigation } from "./side-navigation"
import { cn } from "@/lib/utils"
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

export function FixedHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const isAdminPage = pathname.startsWith("/admin")
  const isSalesPage = pathname.startsWith("/sales")
  const isLogisticsPage = pathname.startsWith("/logistics")

  const getHeaderTitle = () => {
    if (pathname.startsWith("/admin/dashboard")) return "Admin - Dashboard"
    if (pathname.startsWith("/admin/products/create")) return "Admin - Create Product"
    if (pathname.startsWith("/admin/inventory/edit")) return "Admin - Edit Inventory"
    if (pathname.startsWith("/admin/inventory")) return "Admin - Inventory"
    if (pathname.startsWith("/admin/access-management")) return "Admin - Access Management"
    if (pathname.startsWith("/admin/chat-analytics")) return "Admin - Chat Analytics"
    if (pathname.startsWith("/admin/subscriptions")) return "Admin - Subscriptions"
    if (pathname.startsWith("/admin/documents")) return "Admin - Documents" // New admin documents page
    if (pathname.startsWith("/sales/dashboard")) return "Sales - Dashboard"
    if (pathname.startsWith("/sales/bookings")) return "Sales - Bookings"
    if (pathname.startsWith("/sales/clients")) return "Sales - Clients"
    if (pathname.startsWith("/sales/products")) return "Sales - Products"
    if (pathname.startsWith("/sales/proposals")) return "Sales - Proposals"
    if (pathname.startsWith("/sales/quotation-requests")) return "Sales - Quotation Requests"
    if (pathname.startsWith("/sales/job-orders")) return "Sales - Job Orders"
    if (pathname.startsWith("/sales/project-campaigns")) return "Sales - Project Campaigns"
    if (pathname.startsWith("/sales/chat")) return "Sales - Chat"
    if (pathname.startsWith("/sales/planner")) return "Sales - Planner"
    if (pathname.startsWith("/sales/bulletin-board")) return "Sales - Bulletin Board"
    if (pathname.startsWith("/logistics/dashboard")) return "Logistics - Dashboard"
    if (pathname.startsWith("/logistics/alerts")) return "Logistics - Alerts"
    if (pathname.startsWith("/logistics/assignments")) return "Logistics - Assignments"
    if (pathname.startsWith("/logistics/planner")) return "Logistics - Planner"
    if (pathname.startsWith("/logistics/sites")) return "Logistics - Sites"
    return "Dashboard"
  }

  const showBackButton =
    (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/dashboard")) ||
    (pathname.startsWith("/sales/") && !pathname.startsWith("/sales/dashboard")) ||
    (pathname.startsWith("/logistics/") && !pathname.startsWith("/logistics/dashboard"))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Searching for:", searchQuery)
    // Implement actual search logic here
  }

  const headerBgClass = isAdminPage ? "bg-adminHeaderDark" : "bg-salesHeaderRose"
  const buttonHoverClass = isAdminPage ? "hover:bg-adminHeaderDark-light" : "hover:bg-salesHeaderRose-light"

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between px-4 shadow-sm transition-colors duration-300",
        headerBgClass,
      )}
    >
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden text-white">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SideNavigation />
          </SheetContent>
        </Sheet>
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className={cn("text-white", buttonHoverClass)}
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-xl font-semibold text-white">{getHeaderTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 pr-2 py-1 rounded-md bg-white/20 text-white placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-white border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        <Button variant="ghost" size="icon" className={cn("text-white", buttonHoverClass)} aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn("relative h-8 w-8 rounded-full text-white", buttonHoverClass)}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || "/placeholder-user.jpg"} alt="User Avatar" />
                <AvatarFallback>{user?.email ? user.email[0].toUpperCase() : "U"}</AvatarFallback>
              </Avatar>
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.displayName || "User"}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email || "user@example.com"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/account")}>Account Settings</DropdownMenuItem>
            <DropdownMenuItem onClick={logout}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
