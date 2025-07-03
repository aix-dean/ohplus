"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Calendar,
  FileText,
  Home,
  Package,
  Settings,
  Truck,
  Users,
  BarChart3,
  MessageSquare,
  HelpCircle,
  User,
  CreditCard,
  MapPin,
  ClipboardList,
  DollarSign,
  FileBarChart,
  UserCheck,
  Target,
  Bell,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { usePermissions } from "@/hooks/use-permissions"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: Home,
    adminOnly: true,
  },
  {
    title: "Sales",
    icon: DollarSign,
    adminOnly: false,
    children: [
      { title: "Dashboard", href: "/sales/dashboard", icon: Home },
      { title: "Proposals", href: "/sales/proposals", icon: FileText },
      { title: "Quotations", href: "/sales/quotations", icon: FileBarChart },
      { title: "Job Orders", href: "/sales/job-orders", icon: ClipboardList },
      { title: "Bookings", href: "/sales/bookings", icon: Calendar },
      { title: "Clients", href: "/sales/clients", icon: Users },
      { title: "Products", href: "/sales/products", icon: Package },
      { title: "Project Campaigns", href: "/sales/project-campaigns", icon: Target },
      { title: "Planner", href: "/sales/planner", icon: Calendar },
      { title: "Chat", href: "/sales/chat", icon: MessageSquare },
      { title: "Bulletin Board", href: "/sales/bulletin-board", icon: FileText },
    ],
  },
  {
    title: "Logistics",
    icon: Truck,
    adminOnly: false,
    children: [
      { title: "Dashboard", href: "/logistics/dashboard", icon: Home },
      { title: "Sites", href: "/logistics/sites", icon: MapPin },
      { title: "Assignments", href: "/logistics/assignments", icon: UserCheck },
      { title: "Alerts", href: "/logistics/alerts", icon: Bell },
      { title: "Products", href: "/logistics/products", icon: Package },
      { title: "Planner", href: "/logistics/planner", icon: Calendar },
    ],
  },
  {
    title: "CMS",
    icon: FileText,
    adminOnly: false,
    children: [
      { title: "Dashboard", href: "/cms/dashboard", icon: Home },
      { title: "Orders", href: "/cms/orders", icon: ClipboardList },
      { title: "Details", href: "/cms/details", icon: Eye },
      { title: "Planner", href: "/cms/planner", icon: Calendar },
    ],
  },
  {
    title: "Documents",
    href: "/admin/documents",
    icon: FileText,
    adminOnly: true,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: Package,
    adminOnly: true,
    tourTarget: "inventory-nav",
  },
  {
    title: "User Management",
    href: "/admin/access-management",
    icon: Users,
    adminOnly: true,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
    adminOnly: true,
  },
  {
    title: "Chat Analytics",
    href: "/admin/chat-analytics",
    icon: BarChart3,
    adminOnly: true,
  },
]

const bottomNavigationItems = [
  {
    title: "AI Assistant",
    href: "/ai-assistant",
    icon: MessageSquare,
    adminOnly: false,
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
    adminOnly: false,
  },
  {
    title: "Account",
    href: "/account",
    icon: User,
    adminOnly: false,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    adminOnly: false,
  },
]

export function SideNavigation() {
  const pathname = usePathname()
  const isAdmin = useIsAdmin()
  const { hasPermission } = usePermissions()
  const [openSections, setOpenSections] = React.useState<string[]>([])

  const toggleSection = (title: string) => {
    setOpenSections((prev) => (prev.includes(title) ? prev.filter((section) => section !== title) : [...prev, title]))
  }

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const isSectionActive = (children: any[]) => {
    return children.some((child) => isActive(child.href))
  }

  React.useEffect(() => {
    // Auto-open sections that contain the current page
    const sectionsToOpen = navigationItems
      .filter((item) => item.children && isSectionActive(item.children))
      .map((item) => item.title)

    setOpenSections((prev) => [...new Set([...prev, ...sectionsToOpen])])
  }, [pathname])

  const filteredItems = navigationItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  const filteredBottomItems = bottomNavigationItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    return true
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 p-2">
          {filteredItems.map((item) => {
            if (item.children) {
              const isOpen = openSections.includes(item.title)
              const sectionActive = isSectionActive(item.children)

              return (
                <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleSection(item.title)}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant={sectionActive ? "secondary" : "ghost"}
                      className={cn("w-full justify-start gap-2 h-9", sectionActive && "bg-secondary")}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 pl-6 pt-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        variant={isActive(child.href) ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 h-8 text-sm"
                        asChild
                      >
                        <Link href={child.href}>
                          <child.icon className="h-3 w-3" />
                          {child.title}
                        </Link>
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )
            }

            return (
              <Button
                key={item.href}
                variant={isActive(item.href!) ? "secondary" : "ghost"}
                className="w-full justify-start gap-2 h-9"
                asChild
                data-tour-target={item.tourTarget}
              >
                <Link href={item.href!}>
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            )
          })}
        </nav>
      </div>

      <div className="border-t p-2">
        <nav className="space-y-1">
          {filteredBottomItems.map((item) => (
            <Button
              key={item.href}
              variant={isActive(item.href) ? "secondary" : "ghost"}
              className="w-full justify-start gap-2 h-9"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </div>
  )
}
