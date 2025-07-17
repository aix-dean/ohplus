"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Package2,
  Users,
  FileBarChart,
  Bell,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"

export function BusinessSideNavigation() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 bottom-0 z-20 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Notification Section */}
      <div className="p-4 bg-blue-100 rounded-lg mx-2 mt-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Bell size={16} className="text-blue-600 mr-2" />
            <span className={cn("font-medium text-blue-800", collapsed && "hidden")}>Notification</span>
          </div>
          <Link href="/notifications" className={cn("text-xs text-blue-600 hover:underline", collapsed && "hidden")}>
            See All
          </Link>
        </div>
        <p className={cn("text-xs text-blue-700", collapsed && "hidden")}>No notification for now.</p>
      </div>

      {/* To Go Section */}
      <div className="px-3 py-2">
        <h3 className={cn("text-xs font-semibold text-gray-500 px-3 mb-2", collapsed && "hidden")}>To Go</h3>
        <nav className="space-y-1">
          <Link
            href="/business/dashboard"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md group",
              isActive("/business/dashboard")
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <LayoutDashboard size={18} className="mr-3 flex-shrink-0" />
            <span className={cn("truncate", collapsed && "hidden")}>Dashboard</span>
          </Link>
          <Link
            href="/business/bulletin-board"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md group",
              isActive("/business/bulletin-board")
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <FileText size={18} className="mr-3 flex-shrink-0" />
            <span className={cn("truncate", collapsed && "hidden")}>Bulletin Board</span>
          </Link>
        </nav>
      </div>

      {/* To Do Section */}
      <div className="px-3 py-2">
        <h3 className={cn("text-xs font-semibold text-gray-500 px-3 mb-2", collapsed && "hidden")}>To Do</h3>
        <nav className="space-y-1">
          <Link
            href="/business/documents"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md group",
              isActive("/business/documents")
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <FileText size={18} className="mr-3 flex-shrink-0" />
            <span className={cn("truncate", collapsed && "hidden")}>Documents</span>
          </Link>
          <Link
            href="/business/inventory"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md group",
              isActive("/business/inventory")
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <Package2 size={18} className="mr-3 flex-shrink-0" />
            <span className={cn("truncate", collapsed && "hidden")}>Inventory</span>
          </Link>
          <Link
            href="/business/user-management"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md group",
              isActive("/business/user-management")
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <Users size={18} className="mr-3 flex-shrink-0" />
            <span className={cn("truncate", collapsed && "hidden")}>User Management</span>
          </Link>
          <Link
            href="/business/plan-profile"
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md group",
              isActive("/business/plan-profile")
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:bg-gray-50",
            )}
          >
            <FileBarChart size={18} className="mr-3 flex-shrink-0" />
            <span className={cn("truncate", collapsed && "hidden")}>Plan Profile</span>
          </Link>
        </nav>
      </div>

      {/* Intelligence Section */}
      <div className="mt-auto px-3 py-4">
        <div className="bg-purple-600 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Sparkles size={16} className="text-white mr-2" />
              <span className={cn("font-medium text-white", collapsed && "hidden")}>Intelligence</span>
            </div>
            <Link href="/intelligence" className={cn("text-xs text-white hover:underline", collapsed && "hidden")}>
              See All
            </Link>
          </div>
          <div className={cn("flex gap-2 mt-2", collapsed && "hidden")}>
            <div className="bg-purple-500 rounded h-16 w-1/2"></div>
            <div className="bg-purple-500 rounded h-16 w-1/2"></div>
          </div>
          <div className={cn("flex justify-between mt-2", collapsed && "hidden")}>
            <button className="text-white">
              <ChevronLeft size={16} />
            </button>
            <button className="text-white">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 mt-2 text-gray-500 hover:bg-gray-100 rounded-md"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  )
}
