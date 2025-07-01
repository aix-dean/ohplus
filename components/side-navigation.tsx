"use client"
import Link from "next/link"
import type React from "react"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Package,
  Users,
  Settings,
  MessageSquare,
  Calendar,
  DollarSign,
  Briefcase,
  Bell,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BookOpen,
  MapPin,
  ShoppingBag,
  Megaphone,
  ScrollText,
  FileStack,
  FileCheck,
  UserCog,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { Badge } from "@/components/ui/badge"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface NavigationItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
  subItems?: NavigationItem[]
}

export default function SideNavigation() {
  const pathname = usePathname()
  const { isMobile } = useMobile()
  const { user } = useAuth()
  const { unreadCount } = useUnreadMessages()

  const currentSection = pathname.split("/")[1] // e.g., "sales", "logistics", "admin"

  const navigationItems: { [key: string]: NavigationItem[] } = {
    sales: [
      { name: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard },
      { name: "Bulletin Board", href: "/sales/bulletin-board", icon: ClipboardList },
      {
        name: "Chat",
        href: "/sales/chat",
        icon: MessageSquare,
        badge: unreadCount,
      },
      { name: "Planner", href: "/sales/planner", icon: Calendar },
      { name: "Clients", href: "/sales/clients", icon: Users },
      {
        name: "Products",
        href: "/sales/products",
        icon: ShoppingBag,
        subItems: [
          { name: "All Products", href: "/sales/products", icon: Package },
          { name: "New Product", href: "/sales/products/new", icon: Package },
        ],
      },
      {
        name: "Proposals",
        href: "/sales/proposals",
        icon: FileText,
        subItems: [
          { name: "All Proposals", href: "/sales/proposals", icon: FileStack },
          { name: "Create Proposal", href: "/sales/proposals/create", icon: FileText },
        ],
      },
      {
        name: "Cost Estimates",
        href: "/sales/cost-estimates",
        icon: DollarSign,
        subItems: [
          { name: "All Estimates", href: "/sales/cost-estimates", icon: FileStack },
          { name: "Create Estimate", href: "/sales/cost-estimates/create", icon: DollarSign },
        ],
      },
      {
        name: "Quotations",
        href: "/sales/quotation-requests",
        icon: Briefcase,
        subItems: [
          { name: "All Quotations", href: "/sales/quotation-requests", icon: FileCheck },
          { name: "Create Quotation", href: "/sales/quotation-requests/create", icon: Briefcase },
        ],
      },
      {
        name: "Job Orders",
        href: "/sales/job-orders",
        icon: ScrollText,
        subItems: [
          { name: "All Job Orders", href: "/sales/job-orders", icon: FileStack },
          { name: "Create Job Order", href: "/sales/job-orders/create", icon: ScrollText },
        ],
      },
      { name: "Bookings", href: "/sales/bookings", icon: Calendar },
      { name: "Project Campaigns", href: "/sales/project-campaigns", icon: Megaphone },
    ],
    logistics: [
      { name: "Dashboard", href: "/logistics/dashboard", icon: LayoutDashboard },
      { name: "Planner", href: "/logistics/planner", icon: Calendar },
      { name: "Sites", href: "/logistics/sites", icon: MapPin },
      { name: "Products", href: "/logistics/products", icon: Package },
      { name: "Assignments", href: "/logistics/assignments", icon: Briefcase },
      { name: "Alerts", href: "/logistics/alerts", icon: Bell },
    ],
    cms: [
      { name: "Dashboard", href: "/cms/dashboard", icon: LayoutDashboard },
      { name: "Planner", href: "/cms/planner", icon: Calendar },
      { name: "Orders", href: "/cms/orders", icon: ShoppingBag },
      { name: "Details", href: "/cms/details", icon: FileText },
    ],
    admin: [
      // No direct items here, handled by custom rendering below
    ],
    account: [
      { name: "Account Settings", href: "/account", icon: UserCog },
      { name: "Subscription", href: "/admin/subscriptions", icon: CreditCard },
    ],
    // Add other sections as needed
  }

  const commonItems = [
    { name: "Help", href: "/help", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  const renderNavItems = (items: NavigationItem[]) => (
    <nav className="grid items-start gap-2">
      {items.map((item, index) => (
        <div key={index}>
          <Link
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
              pathname === item.href && "bg-sidebar-active text-white",
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
            {item.badge !== undefined && item.badge > 0 && (
              <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
          {item.subItems && (
            <div className="ml-6 mt-1 space-y-1">
              {item.subItems.map((subItem, subIndex) => (
                <Link
                  key={subIndex}
                  href={subItem.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-400 transition-all hover:text-white hover:bg-sidebar-hover",
                    pathname === subItem.href && "bg-sidebar-active text-white",
                  )}
                >
                  <subItem.icon className="h-4 w-4" />
                  {subItem.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )

  return (
    <div
      className={cn(
        "hidden border-r bg-sidebar-DEFAULT lg:block",
        isMobile ? "fixed inset-y-0 left-0 z-50 w-64" : "h-screen w-64",
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-white">
            <img src="/ohplus-new-logo.png" alt="OH Plus Logo" className="h-6 w-auto" />
            <span className="sr-only">OH Plus</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          {currentSection === "admin" ? (
            <div className="px-4 lg:px-6 space-y-6">
              {/* Notification Card */}
              <Card className="bg-blue-500 text-white border-none shadow-none">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-lg font-semibold">Notification</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm">
                  <p className="mb-2">No notification for now.</p>
                  <Button variant="link" className="text-white p-0 h-auto text-sm">
                    See All
                  </Button>
                </CardContent>
              </Card>

              {/* To Go Section */}
              <div className="space-y-2">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">To Go</h3>
                <nav className="grid items-start gap-2">
                  <Link
                    href="/admin/dashboard"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
                      pathname === "/admin/dashboard" && "bg-sidebar-active text-white",
                    )}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/bulletin-board" // Assuming this route exists or will be created
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
                      pathname === "/admin/bulletin-board" && "bg-sidebar-active text-white",
                    )}
                  >
                    <ClipboardList className="h-4 w-4" />
                    Bulletin Board
                  </Link>
                </nav>
              </div>

              {/* To Do Section */}
              <div className="space-y-2">
                <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">To Do</h3>
                <nav className="grid items-start gap-2">
                  <Link
                    href="/admin/documents" // Assuming this route exists or will be created
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
                      pathname === "/admin/documents" && "bg-sidebar-active text-white",
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    Documents
                  </Link>
                  <Link
                    href="/admin/inventory" // Assuming this route exists or will be created
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
                      pathname === "/admin/inventory" && "bg-sidebar-active text-white",
                    )}
                  >
                    <Package className="h-4 w-4" />
                    Inventory
                  </Link>
                  <Link
                    href="/admin/user-management" // Assuming this route exists or will be created
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
                      pathname === "/admin/user-management" && "bg-sidebar-active text-white",
                    )}
                  >
                    <Users className="h-4 w-4" />
                    User Management
                  </Link>
                  <Link
                    href="/admin/subscriptions"
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-sidebar-hover",
                      pathname === "/admin/subscriptions" && "bg-sidebar-active text-white",
                    )}
                  >
                    <CreditCard className="h-4 w-4" />
                    Subscription
                  </Link>
                </nav>
              </div>

              {/* Intelligence Card */}
              <Card className="bg-purple-600 text-white border-none shadow-none">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Intelligence <Sparkles className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between mb-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-purple-700">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex gap-2">
                      <div className="h-10 w-16 bg-purple-700 rounded-md" />
                      <div className="h-10 w-16 bg-purple-700 rounded-md" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-purple-700">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button variant="link" className="text-white p-0 h-auto text-sm">
                    See All
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            renderNavItems(navigationItems[currentSection] || [])
          )}
        </div>
        <div className="mt-auto p-4 border-t border-gray-700">{renderNavItems(commonItems)}</div>
      </div>
    </div>
  )
}
