"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Truck,
  AlertTriangle,
  FileText,
  Settings,
  ShieldCheck,
  BookOpen,
  Package,
  MessageCircle,
  FileCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  CloudRain,
  Cog,
} from "lucide-react"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Navigation data structure with icons
const navigationItems = [
  {
    section: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [],
  },
  {
    section: "features",
    title: "Features",
    icon: Package,
    items: [{ title: "Overview", href: "/features", icon: LayoutDashboard }],
  },
  {
    section: "sales",
    title: "Sales",
    icon: BarChart3,
    items: [
      { title: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard },
      { title: "Project Tracker", href: "/sales/project-campaigns", icon: TrendingUp },
      { title: "Proposals", href: "/sales/proposals", icon: FileCheck },
      { title: "Bookings", href: "/sales/bookings", icon: BookOpen },
      { title: "JOs", href: "/sales/job-orders", icon: ClipboardList },
      { title: "Clients", href: "/sales/clients", icon: Users },
      { title: "Billings", href: "#", icon: FileText },
      { title: "Planner", href: "/sales/planner", icon: Calendar },
      { title: "Customer Chat", href: "/sales/chat", icon: MessageCircle },
    ],
  },
  {
    section: "logistics",
    title: "Logistics",
    icon: Truck,
    items: [
      { title: "Dashboard", href: "/logistics/dashboard", icon: LayoutDashboard },
      { title: "Service Assignments", href: "/logistics/assignments", icon: FileText },
      { title: "Planner", href: "/logistics/planner", icon: Calendar },
      { title: "Alerts", href: "/logistics/alerts", icon: AlertTriangle },
    ],
  },
  {
    section: "cms",
    title: "CMS",
    icon: FileText,
    items: [
      { title: "Dashboard", href: "/cms/dashboard", icon: LayoutDashboard },
      { title: "Planner", href: "/cms/planner", icon: Calendar },
      { title: "Orders", href: "/cms/orders", icon: FileText },
    ],
  },
  {
    section: "admin",
    title: "Admin",
    icon: ShieldCheck,
    items: [],
  },
  {
    section: "settings",
    title: "Settings",
    icon: Settings,
    items: [
      { title: "General", href: "/settings", icon: Settings },
      { title: "Subscription", href: "/admin/subscriptions", icon: FileText },
    ],
  },
]

function isActive(pathname: string, href: string) {
  return pathname === href
}

export function SideNavigation() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { unreadCount } = useUnreadMessages()

  // Determine the current section from the pathname
  let currentSection = pathname?.split("/")[1] || "dashboard"
  if (pathname?.startsWith("/sales/project-campaigns")) {
    currentSection = "sales"
  }
  if (pathname?.startsWith("/admin")) {
    currentSection = "admin"
  }

  // Find the navigation item for the current section
  const currentNavItem = navigationItems.find((item) => item.section === currentSection)

  if (!currentNavItem && currentSection !== "admin" && currentSection !== "sales" && currentSection !== "logistics") {
    return null
  }

  const SectionIcon = currentNavItem?.icon

  return (
    <div className="w-64 h-[calc(100vh-64px)] bg-gray-50 border-r border-gray-200 overflow-y-auto shadow-sm">
      <nav className="p-3 space-y-4">
        {currentSection === "logistics" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-sky-300 to-sky-400 rounded-lg p-3 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Notification</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-3/4"></div>
                  </div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
                  </div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
              </div>
            </div>

            {/* To Go Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Go</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Dashboard", href: "/logistics/dashboard", icon: LayoutDashboard },
                  { title: "Bulletin Board", href: "/logistics/bulletin-board", icon: ClipboardList },
                  { title: "Calendar", href: "/logistics/planner", icon: Calendar },
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* To Do Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Do</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Service Assignments", href: "/logistics/assignments", icon: FileText },
                  { title: "JOs", href: "/logistics/job-orders", icon: ClipboardList },
                  { title: "Reports", href: "/logistics/reports", icon: BarChart3 },
                  { title: "Teams and Personnel", href: "/logistics/teams", icon: Users },
                  { title: "Settings and Config", href: "/logistics/settings", icon: Cog },
                  { title: "News and Weather", href: "/logistics/weather", icon: CloudRain },
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Intelligence Section */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-sm font-medium">Intelligence</h3>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="h-12 bg-white/20 rounded-md"></div>
                    <div className="h-12 bg-white/20 rounded-md"></div>
                  </div>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
              </div>
            </div>
          </>
        ) : currentSection === "admin" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Notification</h3>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/90">No notification for now.</p>
              </div>
              <div className="flex justify-end mt-3">
                <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Go</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
                  { title: "Bulletin Board", href: "/admin/bulletin-board", icon: ClipboardList },
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Do</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Documents", href: "/admin/documents", icon: FileText },
                  { title: "Inventory", href: "/admin/inventory", icon: Package },
                  { title: "User Management", href: "/admin/user-management", icon: Users },
                  { title: "Invitation Codes", href: "/admin/invitation-codes", icon: FileText },
                  { title: "Subscription", href: "/admin/subscriptions", icon: FileText },
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                      <span className="flex-1">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Intelligence Section */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-sm font-medium">Intelligence</h3>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="h-12 bg-white/20 rounded-md"></div>
                    <div className="h-12 bg-white/20 rounded-md"></div>
                  </div>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
              </div>
            </div>
          </>
        ) : currentSection === "sales" ? (
          // Special grouped layout for sales
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Notification</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-white/20 text-white text-xs">JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/30 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/20 rounded-full w-3/4"></div>
                  </div>
                  <button className="w-2 h-2 bg-white rounded-full"></button>
                </div>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback className="bg-white/20 text-white text-xs">SM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/30 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/20 rounded-full w-2/3"></div>
                  </div>
                  <button className="w-2 h-2 bg-white rounded-full"></button>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Do</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard },
                  { title: "Project Tracker", href: "/sales/project-campaigns", icon: TrendingUp },
                  { title: "Bulletin Board", href: "/sales/bulletin-board", icon: ClipboardList },
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                      <span className="flex-1">{item.title}</span>
                      {item.href === "/sales/chat" && unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Go</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Proposals", href: "/sales/proposals", icon: FileCheck },
                  { title: "Bookings", href: "/sales/bookings", icon: BookOpen },
                  { title: "JOs", href: "/sales/job-orders", icon: ClipboardList },
                  { title: "Clients", href: "/sales/clients", icon: Users },
                  { title: "Billings", href: "#", icon: FileText },
                  { title: "Planner", href: "/sales/planner", icon: Calendar },
                  { title: "Customer Chat", href: "/sales/chat", icon: MessageCircle },
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                      <span className="flex-1">{item.title}</span>
                      {item.href === "/sales/chat" && unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Intelligence Section */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-3 text-white">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-sm font-medium">Intelligence</h3>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div className="h-12 bg-white/20 rounded-md"></div>
                    <div className="h-12 bg-white/20 rounded-md"></div>
                  </div>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="text-xs text-white/90 hover:text-white transition-colors">See All</button>
              </div>
            </div>
          </>
        ) : (
          // Default layout for other sections
          currentNavItem?.items.map((item) => {
            const Icon = item.icon
            const active = isActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center py-2.5 px-3 text-sm rounded-md mx-2 my-1 transition-all duration-200",
                  active
                    ? "bg-gray-200 text-gray-900 font-medium shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                <span className="flex-1">{item.title}</span>
                {item.href === "/sales/chat" && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Badge>
                )}
                {active && <div className="ml-auto w-1 h-5 bg-gray-700 rounded-full"></div>}
              </Link>
            )
          })
        )}
      </nav>
    </div>
  )
}
