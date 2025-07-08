"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  FileText,
  Package,
  Users,
  CreditCard,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MapPin,
  Truck,
  AlertTriangle,
  CalendarIcon,
  ShoppingCart,
  Briefcase,
  Target,
  MessageCircle,
  FileBarChart,
  ClipboardList,
} from "lucide-react"

interface SideNavigationProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function SideNavigation({ isCollapsed = false, onToggle }: SideNavigationProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(3)

  // Determine which navigation to show based on current path
  const isAdminPath = pathname?.startsWith("/admin") || pathname === "/logistics/calendar"
  const isLogisticsPath = pathname?.startsWith("/logistics") && pathname !== "/logistics/calendar"
  const isSalesPath = pathname?.startsWith("/sales")
  const isCMSPath = pathname?.startsWith("/cms")

  // Admin navigation items
  const adminNavItems = {
    toGo: [
      { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/chat-analytics", icon: MessageSquare, label: "Bulletin Board" },
      { href: "/logistics/calendar", icon: Calendar, label: "Calendar" },
    ],
    toDo: [
      { href: "/admin/documents", icon: FileText, label: "Documents" },
      { href: "/admin/inventory", icon: Package, label: "Inventory" },
      { href: "/admin/access-management", icon: Users, label: "User Management" },
      { href: "/admin/subscriptions", icon: CreditCard, label: "Subscription" },
    ],
  }

  // Logistics navigation items
  const logisticsNavItems = {
    main: [
      { href: "/logistics/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/logistics/sites", icon: MapPin, label: "Sites" },
      { href: "/logistics/assignments", icon: Truck, label: "Assignments" },
      { href: "/logistics/alerts", icon: AlertTriangle, label: "Alerts" },
      { href: "/logistics/planner", icon: CalendarIcon, label: "Planner" },
    ],
  }

  // Sales navigation items
  const salesNavItems = {
    main: [
      { href: "/sales/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/sales/clients", icon: Users, label: "Clients" },
      { href: "/sales/proposals", icon: FileText, label: "Proposals" },
      { href: "/sales/quotations", icon: FileBarChart, label: "Quotations" },
      { href: "/sales/bookings", icon: ClipboardList, label: "Bookings" },
      { href: "/sales/job-orders", icon: Briefcase, label: "Job Orders" },
      { href: "/sales/project-campaigns", icon: Target, label: "Campaigns" },
      { href: "/sales/products", icon: Package, label: "Products" },
      { href: "/sales/chat", icon: MessageCircle, label: "Chat" },
      { href: "/sales/planner", icon: CalendarIcon, label: "Planner" },
      { href: "/sales/bulletin-board", icon: MessageSquare, label: "Bulletin Board" },
    ],
  }

  // CMS navigation items
  const cmsNavItems = {
    main: [
      { href: "/cms/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/cms/orders", icon: ShoppingCart, label: "Orders" },
      { href: "/cms/planner", icon: CalendarIcon, label: "Planner" },
    ],
  }

  const renderNavItem = (item: any, isActive: boolean) => (
    <Link key={item.href} href={item.href}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={`w-full justify-start gap-3 h-10 ${
          isActive ? "bg-blue-50 text-blue-700 border-blue-200" : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <item.icon className="h-4 w-4" />
        {!isCollapsed && <span className="text-sm">{item.label}</span>}
      </Button>
    </Link>
  )

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-3">
          <Button variant="ghost" size="sm" onClick={onToggle} className="w-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-2">
            {isAdminPath &&
              [...adminNavItems.toGo, ...adminNavItems.toDo].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className="w-full p-2">
                    <item.icon className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            {isLogisticsPath &&
              logisticsNavItems.main.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className="w-full p-2">
                    <item.icon className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            {isSalesPath &&
              salesNavItems.main.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className="w-full p-2">
                    <item.icon className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
            {isCMSPath &&
              cmsNavItems.main.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className="w-full p-2">
                    <item.icon className="h-4 w-4" />
                  </Button>
                </Link>
              ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-gray-200 bg-white flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-6">
          {/* Admin Navigation */}
          {isAdminPath && (
            <>
              {/* Notification Card */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Notification</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mb-3">No notification for now.</p>
                  <Button variant="outline" size="sm" className="w-full text-blue-700 border-blue-300 bg-transparent">
                    See All
                  </Button>
                </CardContent>
              </Card>

              {/* To Go Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">To Go</h3>
                <div className="space-y-1">
                  {adminNavItems.toGo.map((item) => renderNavItem(item, pathname === item.href))}
                </div>
              </div>

              {/* To Do Section */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-3">To Do</h3>
                <div className="space-y-1">
                  {adminNavItems.toDo.map((item) => renderNavItem(item, pathname === item.href))}
                </div>
              </div>

              {/* Intelligence Card */}
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Intelligence</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 mx-2 bg-white/20 rounded h-16"></div>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 p-1">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-purple-600 bg-white border-white">
                    See All
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {/* Logistics Navigation */}
          {isLogisticsPath && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Logistics</h3>
              <div className="space-y-1">
                {logisticsNavItems.main.map((item) => renderNavItem(item, pathname === item.href))}
              </div>
            </div>
          )}

          {/* Sales Navigation */}
          {isSalesPath && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Sales</h3>
              <div className="space-y-1">
                {salesNavItems.main.map((item) => renderNavItem(item, pathname === item.href))}
              </div>
            </div>
          )}

          {/* CMS Navigation */}
          {isCMSPath && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Content Management</h3>
              <div className="space-y-1">
                {cmsNavItems.main.map((item) => renderNavItem(item, pathname === item.href))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
