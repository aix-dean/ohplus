"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  Truck,
  Calendar,
  ShoppingCart,
  CreditCard,
  Shield,
  Bot,
  Megaphone,
  AlertTriangle,
  UserCheck,
  ClipboardList,
  Calculator,
} from "lucide-react"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { usePermissions } from "@/hooks/use-permissions"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  adminOnly?: boolean
  permission?: string
  tourId?: string
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function SideNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, userData, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount } = useUnreadMessages()
  const isAdmin = useIsAdmin()
  const { hasPermission } = usePermissions()

  // Define navigation sections
  const navigationSections: NavigationSection[] = [
    {
      title: "Main",
      items: [
        {
          name: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Inventory",
          href: "/admin/inventory",
          icon: Package,
          tourId: "inventory-link",
        },
        {
          name: "AI Assistant",
          href: "/ai-assistant",
          icon: Bot,
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          name: "Sales Dashboard",
          href: "/sales/dashboard",
          icon: BarChart3,
          permission: "sales:read",
        },
        {
          name: "Proposals",
          href: "/sales/proposals",
          icon: FileText,
          permission: "sales:read",
        },
        {
          name: "Quotations",
          href: "/sales/quotations",
          icon: Calculator,
          permission: "sales:read",
        },
        {
          name: "Job Orders",
          href: "/sales/job-orders",
          icon: ClipboardList,
          permission: "sales:read",
        },
        {
          name: "Clients",
          href: "/sales/clients",
          icon: Users,
          permission: "sales:read",
        },
        {
          name: "Products",
          href: "/sales/products",
          icon: Package,
          permission: "sales:read",
        },
        {
          name: "Project Campaigns",
          href: "/sales/project-campaigns",
          icon: Megaphone,
          permission: "sales:read",
        },
        {
          name: "Bookings",
          href: "/sales/bookings",
          icon: Calendar,
          permission: "sales:read",
        },
        {
          name: "Sales Chat",
          href: "/sales/chat",
          icon: MessageSquare,
          badge: unreadCount,
          permission: "sales:read",
        },
        {
          name: "Planner",
          href: "/sales/planner",
          icon: Calendar,
          permission: "sales:read",
        },
        {
          name: "Bulletin Board",
          href: "/sales/bulletin-board",
          icon: Megaphone,
          permission: "sales:read",
        },
      ],
    },
    {
      title: "Logistics",
      items: [
        {
          name: "Logistics Dashboard",
          href: "/logistics/dashboard",
          icon: Truck,
          permission: "logistics:read",
        },
        {
          name: "Assignments",
          href: "/logistics/assignments",
          icon: UserCheck,
          permission: "logistics:read",
        },
        {
          name: "Alerts",
          href: "/logistics/alerts",
          icon: AlertTriangle,
          permission: "logistics:read",
        },
        {
          name: "Planner",
          href: "/logistics/planner",
          icon: Calendar,
          permission: "logistics:read",
        },
      ],
    },
    {
      title: "Content Management",
      items: [
        {
          name: "CMS Dashboard",
          href: "/cms/dashboard",
          icon: LayoutDashboard,
          permission: "cms:read",
        },
        {
          name: "Orders",
          href: "/cms/orders",
          icon: ShoppingCart,
          permission: "cms:read",
        },
        {
          name: "Planner",
          href: "/cms/planner",
          icon: Calendar,
          permission: "cms:read",
        },
      ],
    },
    {
      title: "Admin",
      items: [
        {
          name: "Subscriptions",
          href: "/admin/subscriptions",
          icon: CreditCard,
          adminOnly: true,
        },
        {
          name: "Access Management",
          href: "/admin/access-management",
          icon: Shield,
          adminOnly: true,
        },
        {
          name: "Chat Analytics",
          href: "/admin/chat-analytics",
          icon: BarChart3,
          adminOnly: true,
        },
        {
          name: "Documents",
          href: "/admin/documents",
          icon: FileText,
          adminOnly: true,
        },
      ],
    },
  ]

  const handleNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const shouldShowItem = (item: NavigationItem) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.permission && !hasPermission(item.permission)) return false
    return true
  }

  const NavigationContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded bg-primary" />
          <span className="text-lg font-semibold">OH!Plus</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section) => {
            const visibleItems = section.items.filter(shouldShowItem)
            if (visibleItems.length === 0) return null

            return (
              <div key={section.title}>
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {visibleItems.map((item) => (
                    <Button
                      key={item.name}
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => handleNavigation(item.href)}
                      data-tour-id={item.tourId}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.name}
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => handleNavigation("/help")}>
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>
          <Separator />
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{userData?.name || user?.email}</p>
            <p className="text-xs text-gray-500">{userData?.company || "No company"}</p>
          </div>
          <Button variant="outline" className="w-full bg-transparent" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Navigation */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden bg-transparent">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <NavigationContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden w-64 border-r bg-white md:block">
        <NavigationContent />
      </div>
    </>
  )
}
