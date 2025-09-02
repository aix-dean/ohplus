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
  Monitor,
  DollarSign,
  Receipt,
  CreditCard,
  Wallet,
  CalendarCheck,
} from "lucide-react"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useAuth } from "@/contexts/auth-context"
import { LogisticsNotifications } from "@/components/logistics-notifications"

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
      { title: "Quotations", href: "/sales/quotations-list", icon: FileText }, // Added new item for Quotations
      { title: "Bookings", href: "/sales/bookings", icon: BookOpen },
      { title: "Reservation", href: "/sales/reservation", icon: CalendarCheck },
      { title: "JOs", href: "/sales/job-orders", icon: ClipboardList },
      { title: "Clients", href: "/sales/clients", icon: Users },
      { title: "Billings", href: "#", icon: FileText },
      { title: "Planner", href: "/sales/planner", icon: Calendar },
      { title: "Customer Chat", href: "/sales/chat", icon: MessageCircle },
      { title: "Collectibles", href: "/sales/collectibles", icon: Package },
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
    section: "business",
    title: "Business",
    icon: BarChart3,
    items: [
      { title: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
      { title: "Overview", href: "/business/overview", icon: BarChart3 },
      { title: "Reports", href: "/business/reports", icon: FileText },
    ],
  },
  {
    section: "finance",
    title: "Finance",
    icon: DollarSign,
    items: [
      { title: "Dashboard", href: "/finance", icon: LayoutDashboard },
      { title: "Invoices", href: "/finance/invoices", icon: Receipt },
      { title: "Expenses", href: "/finance/expenses", icon: CreditCard },
      { title: "Reports", href: "/finance/reports", icon: BarChart3 },
      { title: "Budget Planning", href: "/finance/budget", icon: Calendar },
      { title: "Tax Management", href: "/finance/tax", icon: FileText },
      { title: "Collectibles", href: "/finance/collectibles", icon: Package },
    ],
  },
  {
    section: "treasury",
    title: "Treasury",
    icon: Wallet,
    items: [
      { title: "Dashboard", href: "/treasury", icon: LayoutDashboard },
      { title: "Requests", href: "/treasury/quotations", icon: FileText },
      { title: "Reports", href: "/treasury/reports", icon: BarChart3 },
    ],
  },
  {
    section: "accounting",
    title: "Accounting",
    icon: DollarSign,
    items: [
      { title: "Sales Record", href: "/accounting/sales-record", icon: FileText },
      { title: "Sales and Collection", href: "/accounting/sales-and-collection", icon: Receipt },
      { title: "Encashment", href: "/accounting/encashment", icon: CreditCard },
    ],
  },
  {
    section: "it",
    title: "IT",
    icon: Monitor,
    items: [
      { title: "Dashboard", href: "/it", icon: LayoutDashboard },
      { title: "System Status", href: "/it/system-status", icon: Monitor },
      { title: "Support Overview", href: "/it/support-overview", icon: AlertTriangle },
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
      { title: "Plan Profile", href: "/admin/subscriptions", icon: FileText },
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
  if (pathname?.startsWith("/sales/quotations-list")) {
    // Ensure sales section is active for new quotations page
    currentSection = "sales"
  }
  if (pathname?.startsWith("/business")) {
    currentSection = "business"
  }
  if (pathname?.startsWith("/it")) {
    currentSection = "it"
  }
  if (pathname?.startsWith("/finance")) {
    currentSection = "finance"
  }
  if (pathname?.startsWith("/accounting")) {
    currentSection = "accounting"
  }

  // Find the navigation item for the current section
  const currentNavItem = navigationItems.find((item) => item.section === currentSection)

  if (
    !currentNavItem &&
    currentSection !== "admin" &&
    currentSection !== "sales" &&
    currentSection !== "logistics" &&
    currentSection !== "cms" &&
    currentSection !== "business" &&
    currentSection !== "it" &&
    currentSection !== "finance" &&
    currentSection !== "accounting"
  ) {
    return null
  }

  const SectionIcon = currentNavItem?.icon

  return (
    <div className="w-64 h-[calc(100vh-64px)] bg-gray-50 border-r border-gray-200 shadow-sm flex flex-col">
      <nav className="p-3 space-y-4 flex-1 min-h-0">
        {currentSection === "cms" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 text-white">
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
                  { title: "Dashboard", href: "/cms/dashboard", icon: LayoutDashboard },
                  { title: "Planner", href: "/cms/planner", icon: Calendar },
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
                  { title: "JOs", href: "/cms/orders", icon: ClipboardList },
                  { title: "Content Library", href: "/cms/content", icon: FileText },
                  { title: "Screen Management", href: "/cms/screens", icon: Monitor },
                  { title: "Campaign Scheduler", href: "/cms/scheduler", icon: Calendar },
                  { title: "Analytics", href: "/cms/analytics", icon: BarChart3 },
                  { title: "Settings", href: "/cms/settings", icon: Cog },
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
        ) : currentSection === "logistics" ? (
          <>
            <LogisticsNotifications />

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
                  { title: "Reports", href: "/logistics/service-reports", icon: BarChart3 },
                  { title: "Fleet", href: "/logistics/fleet", icon: Truck },
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
        ) : currentSection === "business" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg p-3 text-white">
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
                  { title: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
                  { title: "Overview", href: "/business/overview", icon: BarChart3 },
                  { title: "Reports", href: "/business/reports", icon: FileText },
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
                  { title: "Inventory", href: "/business/inventory", icon: Package },
                  { title: "Assets", href: "/business/assets", icon: FileText },
                  { title: "Suppliers", href: "/business/suppliers", icon: Users },
                  { title: "Purchase Orders", href: "/business/purchase-orders", icon: ClipboardList },
                  { title: "Financial Reports", href: "/business/financial-reports", icon: BarChart3 },
                  { title: "Settings", href: "/business/settings", icon: Cog },
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
        ) : currentSection === "it" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-lg p-3 text-white">
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
                  { title: "Dashboard", href: "/it", icon: LayoutDashboard },
                  { title: "System Status", href: "/it/system-status", icon: Monitor },
                  { title: "Support Overview", href: "/it/support-overview", icon: AlertTriangle },
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
                  { title: "Support Tickets", href: "/it/support", icon: AlertTriangle },
                  { title: "Assets", href: "/it/inventory", icon: Package },
                  { title: "User Management", href: "/it/user-management", icon: Users },
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
        ) : currentSection === "finance" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg p-3 text-white">
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                  { title: "Dashboard", href: "/finance", icon: LayoutDashboard },
                  { title: "Reports", href: "/finance/reports", icon: BarChart3 },
                  { title: "Budget Planning", href: "/finance/budget", icon: Calendar },
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
                  { title: "Invoices", href: "/finance/invoices", icon: Receipt },
                  { title: "Expenses", href: "/finance/expenses", icon: CreditCard },
                  { title: "Requests", href: "/finance/requests", icon: ClipboardList },
                  { title: "Collectibles", href: "/finance/collectibles", icon: Package },
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
        ) : currentSection === "accounting" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg p-3 text-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">Notification</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/30 rounded-full"></div>
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-white/40 rounded-full mb-1"></div>
                    <div className="h-2 bg-white/30 rounded-full w-2/3"></div>
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
                  { title: "Sales Record", href: "/accounting/sales-record", icon: FileText },
                  { title: "Sales and Collection", href: "/accounting/sales-and-collection", icon: Receipt },
                  { title: "Encashment", href: "/accounting/encashment", icon: CreditCard },
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
                  { title: "Invoices", href: "/accounting/invoices", icon: Receipt },
                  { title: "Expenses", href: "/accounting/expenses", icon: CreditCard },
                  { title: "Requests", href: "/accounting/requests", icon: ClipboardList },
                  { title: "Payments", href: "/accounting/payments", icon: DollarSign },
                  { title: "Tax Management", href: "/accounting/tax", icon: FileText },
                  { title: "Financial Analysis", href: "/accounting/analysis", icon: TrendingUp },
                  { title: "Settings", href: "/accounting/settings", icon: Cog },
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
                <button classNameclassName="text-xs text-white/90 hover:text-white transition-colors">See All</button>
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
                  { title: "Plan Profile", href: "/admin/subscriptions", icon: FileText },
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
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg p-3 text-white">
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

            {/* To Do Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Do</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard },
                  { title: "Project Tracker", href: "/sales/project-campaigns", icon: TrendingUp },
                  { title: "Project Bulletins", href: "/sales/project-monitoring", icon: Monitor },
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
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* To Go Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">To Go</h3>
              </div>
              <div className="p-1">
                {[
                  { title: "Proposals", href: "/sales/proposals", icon: FileCheck },
                  { title: "Quotations", href: "/sales/quotations-list", icon: FileText },
                  { title: "Bookings", href: "/sales/bookings", icon: BookOpen },
                  { title: "Reservation", href: "/sales/reservation", icon: CalendarCheck },
                  { title: "JOs", href: "/sales/job-orders", icon: ClipboardList },
                  { title: "Clients", href: "/sales/clients", icon: Users },
                  { title: "Billings", href: "#", icon: FileText },
                  { title: "Planner", href: "/sales/planner", icon: Calendar },
                  { title: "Customer Chat", href: "/sales/chat", icon: MessageCircle },
                  { title: "Collectibles", href: "/sales/collectibles", icon: Package },
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
        ) : currentSection === "treasury" ? (
          <>
            {/* Notification Section */}
            <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 text-white">
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
                  { title: "Dashboard", href: "/treasury", icon: LayoutDashboard },
                  { title: "Collectibles", href: "/treasury/collectibles", icon: Package },
                  { title: "Requests", href: "/treasury/quotations", icon: FileText },
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
                  { title: "Reports", href: "/treasury/reports", icon: BarChart3 },
                  { title: "Settings", href: "/treasury/settings", icon: Settings },
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
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="px-3 py-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Navigation</h3>
            </div>
            <div className="p-1">
              {currentNavItem?.items?.map((item) => {
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
        )}
      </nav>
    </div>
  )
}
