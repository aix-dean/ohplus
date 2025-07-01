"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Menu, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface FixedHeaderProps {
  onMenuClick: () => void
}

export function FixedHeader({ onMenuClick }: FixedHeaderProps) {
  const pathname = usePathname()

  const getPageTitle = (path: string) => {
    if (path.startsWith("/admin")) {
      return "Admin- Dashboard"
    }
    switch (path) {
      case "/dashboard":
        return "Dashboard"
      case "/sales":
        return "Sales Dashboard"
      case "/sales/bookings":
        return "Bookings"
      case "/sales/clients":
        return "Clients"
      case "/sales/products":
        return "Products"
      case "/sales/proposals":
        return "Proposals"
      case "/sales/job-orders":
        return "Job Orders"
      case "/sales/project-campaigns":
        return "Project Campaigns"
      case "/sales/chat":
        return "Sales Chat"
      case "/sales/planner":
        return "Sales Planner"
      case "/logistics":
        return "Logistics Dashboard"
      case "/logistics/alerts":
        return "Alerts"
      case "/logistics/assignments":
        return "Assignments"
      case "/logistics/planner":
        return "Logistics Planner"
      case "/logistics/products":
        return "Products"
      case "/logistics/sites":
        return "Sites"
      case "/cms/dashboard":
        return "CMS Dashboard"
      case "/cms/orders":
        return "Orders"
      case "/cms/planner":
        return "CMS Planner"
      case "/account":
        return "Account Settings"
      case "/settings":
        return "Settings"
      case "/settings/subscription":
        return "Subscription"
      case "/ai-assistant":
        return "AI Assistant"
      case "/help":
        return "Help & Support"
      case "/onboarding":
        return "Onboarding"
      case "/forgot-password":
        return "Forgot Password"
      case "/login":
        return "Login"
      case "/register":
        return "Register"
      case "/features":
        return "Features"
      default:
        if (path.startsWith("/sales/proposals/")) return "Proposal Details"
        if (path.startsWith("/sales/products/")) return "Product Details"
        if (path.startsWith("/sales/bookings/")) return "Booking Details"
        if (path.startsWith("/logistics/sites/")) return "Site Details"
        if (path.startsWith("/cms/details/")) return "CMS Item Details"
        if (path.startsWith("/admin/inventory/edit/")) return "Edit Inventory Item"
        if (path.startsWith("/admin/inventory/")) return "Inventory Item Details"
        if (path.startsWith("/proposals/view/")) return "View Proposal"
        if (path.startsWith("/cost-estimates/view/")) return "View Cost Estimate"
        if (path.startsWith("/quotations/")) return "Quotation"
        if (path.startsWith("/sales/cost-estimates/")) return "Cost Estimate"
        if (path.startsWith("/sales/quotation-requests/")) return "Quotation Request"
        if (path.startsWith("/sales/chat/")) return "Sales Chat Thread"
        return "Dashboard" // Fallback for dynamic routes not explicitly listed
    }
  }

  const title = getPageTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden bg-transparent" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            {/* This is a simplified mobile nav. The full SideNavigation handles the actual logic. */}
            <Link href="#" className="flex items-center gap-2 text-lg font-semibold">
              <span className="sr-only">ERP v2</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link href="/sales" className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
              Sales
            </Link>
            <Link
              href="/logistics"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Logistics
            </Link>
            <Link
              href="/cms/dashboard"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              CMS
            </Link>
            <Link href="/admin" className="flex items-center gap-4 px-2.5 text-foreground">
              Admin
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Account
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
            >
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <h1 className="font-semibold text-lg md:text-xl">{title}</h1>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Bell className="h-4 w-4" />
        <span className="sr-only">Notifications</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="hidden md:flex items-center text-sm text-muted-foreground">
        {format(new Date(), "MMM d, yyyy, h:mm a")}
      </div>
    </header>
  )
}
