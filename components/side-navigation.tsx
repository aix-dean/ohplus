"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Package,
  Users,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const adminNavItems = [
  {
    title: "To Go",
    items: [
      {
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Bulletin Board",
        href: "/admin/bulletin-board",
        icon: FileText,
      },
      {
        title: "Calendar",
        href: "/logistics/calendar",
        icon: Calendar,
      },
    ],
  },
  {
    title: "To Do",
    items: [
      {
        title: "Documents",
        href: "/admin/documents",
        icon: FileText,
      },
      {
        title: "Inventory",
        href: "/admin/inventory",
        icon: Package,
      },
      {
        title: "User Management",
        href: "/admin/access-management",
        icon: Users,
      },
      {
        title: "Subscription",
        href: "/admin/subscriptions",
        icon: CreditCard,
      },
    ],
  },
]

const logisticsNavItems = [
  {
    title: "Navigation",
    items: [
      {
        title: "Dashboard",
        href: "/logistics/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Sites",
        href: "/logistics/sites",
        icon: Package,
      },
      {
        title: "Assignments",
        href: "/logistics/assignments",
        icon: Users,
      },
      {
        title: "Alerts",
        href: "/logistics/alerts",
        icon: Bell,
      },
      {
        title: "Planner",
        href: "/logistics/planner",
        icon: Calendar,
      },
    ],
  },
]

const salesNavItems = [
  {
    title: "Navigation",
    items: [
      {
        title: "Dashboard",
        href: "/sales/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Proposals",
        href: "/sales/proposals",
        icon: FileText,
      },
      {
        title: "Clients",
        href: "/sales/clients",
        icon: Users,
      },
      {
        title: "Products",
        href: "/sales/products",
        icon: Package,
      },
      {
        title: "Bookings",
        href: "/sales/bookings",
        icon: Calendar,
      },
      {
        title: "Job Orders",
        href: "/sales/job-orders",
        icon: Settings,
      },
      {
        title: "Project Campaigns",
        href: "/sales/project-campaigns",
        icon: Lightbulb,
      },
      {
        title: "Planner",
        href: "/sales/planner",
        icon: Calendar,
      },
      {
        title: "Chat",
        href: "/sales/chat",
        icon: FileText,
      },
      {
        title: "Bulletin Board",
        href: "/sales/bulletin-board",
        icon: FileText,
      },
    ],
  },
]

const cmsNavItems = [
  {
    title: "Navigation",
    items: [
      {
        title: "Dashboard",
        href: "/cms/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Orders",
        href: "/cms/orders",
        icon: Package,
      },
      {
        title: "Planner",
        href: "/cms/planner",
        icon: Calendar,
      },
    ],
  },
]

export function SideNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  // Determine which navigation items to show based on current path
  const getNavItems = () => {
    if (pathname?.startsWith("/admin") || pathname === "/logistics/calendar") {
      return adminNavItems
    } else if (pathname?.startsWith("/logistics")) {
      return logisticsNavItems
    } else if (pathname?.startsWith("/sales")) {
      return salesNavItems
    } else if (pathname?.startsWith("/cms")) {
      return cmsNavItems
    }
    return adminNavItems // Default to admin
  }

  const navItems = getNavItems()
  const isAdminLayout = pathname?.startsWith("/admin") || pathname === "/logistics/calendar"

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end p-4">
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className="h-8 w-8 p-0">
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Admin-specific sections */}
      {isAdminLayout && !isCollapsed && (
        <>
          {/* Notification Section */}
          <div className="mx-4 mb-4">
            <div className="bg-blue-500 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm">Notification</h3>
                <Button variant="ghost" size="sm" className="text-white hover:bg-blue-600 h-6 px-2 text-xs">
                  See All
                </Button>
              </div>
              <p className="text-xs opacity-90">No notification for now.</p>
            </div>
          </div>
        </>
      )}

      {/* Navigation Items */}
      <div className="flex-1 px-4 space-y-6">
        {navItems.map((section) => (
          <div key={section.title}>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{section.title}</h3>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon className={cn("flex-shrink-0", isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Admin-specific Intelligence section */}
      {isAdminLayout && !isCollapsed && (
        <div className="mx-4 mb-4">
          <div className="bg-purple-500 text-white p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                <h3 className="font-semibold text-sm">Intelligence</h3>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-white hover:bg-purple-600 h-6 w-6 p-0">
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <div className="flex-1 mx-2 bg-purple-400 rounded h-12"></div>
              <Button variant="ghost" size="sm" className="text-white hover:bg-purple-600 h-6 w-6 p-0">
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-purple-600 h-6 px-2 text-xs">
                See All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
