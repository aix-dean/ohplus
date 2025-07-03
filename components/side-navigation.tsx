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
} from "lucide-react"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTour } from "@/contexts/tour-context" // Import useTour

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
      { title: "Billings", href: "#", icon: FileText }, // Added Billings here
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
    items: [], // Custom content will be rendered below
  },
  {
    section: "settings",
    title: "Settings",
    icon: Settings,
    items: [
      { title: "General", href: "/settings", icon: Settings },
      { title: "Subscription", href: "/admin/subscriptions", icon: FileText }, // Updated href
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
  const { tourActive, currentStep, nextStep } = useTour() // Use tour hook

  // Determine the current section from the pathname
  let currentSection = pathname?.split("/")[1] || "dashboard"
  if (pathname?.startsWith("/sales/project-campaigns")) {
    currentSection = "sales"
  }
  // Explicitly set currentSection to "admin" if path starts with /admin or /admin/dashboard
  if (pathname?.startsWith("/admin")) {
    currentSection = "admin"
  }

  // Find the navigation item for the current section
  const currentNavItem = navigationItems.find((item) => item.section === currentSection)

  // IMPORTANT: Modified condition.
  // Only return null if there's no currentNavItem AND it's not one of the custom sections ("admin", "sales")
  if (!currentNavItem && currentSection !== "admin" && currentSection !== "sales") {
    return null
  }

  const SectionIcon = currentNavItem?.icon // Use optional chaining as currentNavItem might be undefined for custom sections

  return (
    <div className="w-64 h-[calc(100vh-64px)] bg-gray-50 border-r border-gray-200 overflow-y-auto shadow-sm">
      <nav className="p-3 space-y-4">
        {currentSection === "admin" ? (
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
                  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard }, // Updated href
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
                  { title: "User Management", href: "/admin/access-management", icon: Users },
                  { title: "Subscription", href: "/admin/subscriptions", icon: FileText }, // Updated href
                ].map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)
                  const isInventoryLink = item.href === "/admin/inventory" // Check if it's the inventory link

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      id={isInventoryLink ? "tour-inventory-link" : undefined} // Add ID for tour
                      onClick={isInventoryLink && tourActive && currentStep === 1 ? nextStep : undefined} // Advance tour on click
                      className={cn(
                        "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                        active
                          ? "bg-gray-100 text-gray-900 font-medium"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        isInventoryLink && tourActive && currentStep === 1 && "ring-4 ring-blue-500 ring-offset-2", // Highlight for tour
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
                  { title: "Bulletin Board", href: "/sales/bulletin-board", icon: ClipboardList }, // New item
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
                  { title: "Billings", href: "#", icon: FileText }, // Added Billings here
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
            // Use optional chaining here
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
