"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Package,
  Users,
  Settings,
  CreditCard,
  Bell,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface SideNavigationProps {
  className?: string
}

export function SideNavigation({ className }: SideNavigationProps) {
  const pathname = usePathname()

  // Show admin sidebar for admin routes and logistics calendar
  const isAdminSection = pathname?.startsWith("/admin") || pathname === "/logistics/calendar"

  if (isAdminSection) {
    return (
      <div className={cn("w-64 bg-white border-r border-gray-200 h-full flex flex-col", className)}>
        {/* Notification Section */}
        <div className="p-4">
          <div className="bg-blue-500 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Notification</h3>
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-sm mb-3">No notification for now.</p>
            <button className="text-sm underline">See All</button>
          </div>
        </div>

        {/* To Go Section */}
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">To Go</h4>
          <div className="space-y-1">
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/admin/dashboard"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/sales/bulletin-board"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/sales/bulletin-board"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Bulletin Board</span>
            </Link>
            <Link
              href="/logistics/calendar"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/logistics/calendar"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Calendar className="h-4 w-4" />
              <span>Calendar</span>
            </Link>
          </div>
        </div>

        {/* To Do Section */}
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-500 mb-3">To Do</h4>
          <div className="space-y-1">
            <Link
              href="/admin/documents"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/admin/documents"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </Link>
            <Link
              href="/admin/inventory"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname?.startsWith("/admin/inventory")
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Package className="h-4 w-4" />
              <span>Inventory</span>
            </Link>
            <Link
              href="/admin/access-management"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname === "/admin/access-management"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <Users className="h-4 w-4" />
              <span>User Management</span>
            </Link>
            <Link
              href="/admin/subscriptions"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                pathname?.startsWith("/admin/subscriptions")
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <CreditCard className="h-4 w-4" />
              <span>Subscription</span>
            </Link>
          </div>
        </div>

        {/* Intelligence Section */}
        <div className="px-4 pb-4 mt-auto">
          <div className="bg-purple-500 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Intelligence
              </h3>
            </div>
            <div className="flex items-center justify-between mb-3">
              <ChevronLeft className="h-4 w-4" />
              <div className="flex space-x-2">
                <div className="w-16 h-12 bg-purple-400 rounded"></div>
                <div className="w-16 h-12 bg-purple-400 rounded"></div>
              </div>
              <ChevronRight className="h-4 w-4" />
            </div>
            <button className="text-sm underline">See All</button>
          </div>
        </div>
      </div>
    )
  }

  // Default navigation for other sections
  return (
    <div className={cn("w-64 bg-white border-r border-gray-200 h-full", className)}>
      <div className="p-4">
        <nav className="space-y-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/dashboard"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/settings"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === "/settings"
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  )
}
