"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Home,
  Users,
  Package,
  BarChart3,
  Settings,
  FileText,
  Calendar,
  MessageSquare,
  Truck,
  Building2,
  HelpCircle,
  Menu,
  Mail,
  Shield,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["admin", "manager", "editor", "user"],
  },
  {
    title: "Sales",
    icon: BarChart3,
    roles: ["admin", "manager", "editor"],
    children: [
      { title: "Dashboard", href: "/sales/dashboard", icon: Home },
      { title: "Proposals", href: "/sales/proposals", icon: FileText },
      { title: "Clients", href: "/sales/clients", icon: Users },
      { title: "Products", href: "/sales/products", icon: Package },
      { title: "Job Orders", href: "/sales/job-orders", icon: Calendar },
      { title: "Project Campaigns", href: "/sales/project-campaigns", icon: Building2 },
      { title: "Bookings", href: "/sales/bookings", icon: Calendar },
      { title: "Chat", href: "/sales/chat", icon: MessageSquare },
      { title: "Planner", href: "/sales/planner", icon: Calendar },
      { title: "Bulletin Board", href: "/sales/bulletin-board", icon: FileText },
    ],
  },
  {
    title: "Logistics",
    icon: Truck,
    roles: ["admin", "manager"],
    children: [
      { title: "Dashboard", href: "/logistics/dashboard", icon: Home },
      { title: "Sites", href: "/logistics/sites", icon: Building2 },
      { title: "Assignments", href: "/logistics/assignments", icon: Users },
      { title: "Alerts", href: "/logistics/alerts", icon: MessageSquare },
      { title: "Planner", href: "/logistics/planner", icon: Calendar },
    ],
  },
  {
    title: "CMS",
    icon: FileText,
    roles: ["admin", "manager", "editor"],
    children: [
      { title: "Dashboard", href: "/cms/dashboard", icon: Home },
      { title: "Orders", href: "/cms/orders", icon: Package },
      { title: "Planner", href: "/cms/planner", icon: Calendar },
    ],
  },
  {
    title: "Admin",
    icon: Shield,
    roles: ["admin"],
    children: [
      { title: "Dashboard", href: "/admin/dashboard", icon: Home },
      { title: "User Management", href: "/admin/user-management", icon: Users },
      { title: "Invitation Codes", href: "/admin/invitation-codes", icon: Mail },
      { title: "Inventory", href: "/admin/inventory", icon: Package },
      { title: "Documents", href: "/admin/documents", icon: FileText },
      { title: "Chat Analytics", href: "/admin/chat-analytics", icon: BarChart3 },
      { title: "Subscriptions", href: "/admin/subscriptions", icon: Settings },
    ],
  },
  {
    title: "AI Assistant",
    href: "/ai-assistant",
    icon: MessageSquare,
    roles: ["admin", "manager", "editor", "user"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["admin", "manager", "editor", "user"],
  },
  {
    title: "Help",
    href: "/help",
    icon: HelpCircle,
    roles: ["admin", "manager", "editor", "user"],
  },
]

interface SideNavigationProps {
  className?: string
}

export function SideNavigation({ className }: SideNavigationProps) {
  const pathname = usePathname()
  const { userData } = useAuth()
  const [openSections, setOpenSections] = useState<string[]>([])

  const toggleSection = (title: string) => {
    setOpenSections((prev) => (prev.includes(title) ? prev.filter((section) => section !== title) : [...prev, title]))
  }

  const hasAccess = (roles: string[]) => {
    if (!userData?.role) return false
    return roles.includes(userData.role)
  }

  const NavigationContent = () => (
    <ScrollArea className="h-full py-6">
      <div className="space-y-2 px-3">
        {navigationItems.map((item) => {
          if (!hasAccess(item.roles)) return null

          if (item.children) {
            const isOpen = openSections.includes(item.title)
            const hasActiveChild = item.children.some((child) => pathname.startsWith(child.href))

            return (
              <div key={item.title}>
                <Button
                  variant="ghost"
                  className={cn("w-full justify-start", (isOpen || hasActiveChild) && "bg-accent")}
                  onClick={() => toggleSection(item.title)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
                {isOpen && (
                  <div className="ml-4 mt-2 space-y-1">
                    {item.children.map((child) => (
                      <Link key={child.href} href={child.href}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("w-full justify-start", pathname === child.href && "bg-accent")}
                        >
                          <child.icon className="mr-2 h-3 w-3" />
                          {child.title}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link key={item.href} href={item.href!}>
              <Button variant="ghost" className={cn("w-full justify-start", pathname === item.href && "bg-accent")}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </Link>
          )
        })}
      </div>
    </ScrollArea>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden md:flex h-full w-64 flex-col border-r bg-background", className)}>
        <NavigationContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <NavigationContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
