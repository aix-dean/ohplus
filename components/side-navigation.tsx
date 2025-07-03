"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Building2,
  ShoppingCart,
  FileText,
  Calendar,
  Settings,
  BarChart,
  MessageSquare,
  Truck,
  ClipboardList,
  DollarSign,
  Megaphone,
  Briefcase,
  HelpCircle,
  Package,
  CreditCard,
  AlertTriangle,
} from "lucide-react"
import { useUserRoles } from "@/hooks/use-permissions" // Corrected import

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[] // Roles that can access this item
  tourId?: string // Optional ID for tour targeting
}

const navItems: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { href: "/sales/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["sales"] },
  { href: "/logistics/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["logistics"] },
  { href: "/cms/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["cms"] },
  { href: "/admin/inventory", label: "Inventory", icon: Building2, roles: ["admin"], tourId: "inventory-nav-item" },
  { href: "/sales/products", label: "Products", icon: Package, roles: ["sales"] },
  { href: "/sales/clients", label: "Clients", icon: Users, roles: ["sales"] },
  { href: "/sales/proposals", label: "Proposals", icon: FileText, roles: ["sales"] },
  { href: "/sales/quotation-requests", label: "Quotation Requests", icon: DollarSign, roles: ["sales"] },
  { href: "/sales/bookings", label: "Bookings", icon: ShoppingCart, roles: ["sales"] },
  { href: "/sales/job-orders", label: "Job Orders", icon: ClipboardList, roles: ["sales"] },
  { href: "/sales/project-campaigns", label: "Project Campaigns", icon: Megaphone, roles: ["sales"] },
  { href: "/sales/planner", label: "Planner", icon: Calendar, roles: ["sales"] },
  { href: "/sales/bulletin-board", label: "Bulletin Board", icon: Briefcase, roles: ["sales"] },
  { href: "/logistics/assignments", label: "Assignments", icon: Truck, roles: ["logistics"] },
  { href: "/logistics/alerts", label: "Alerts", icon: AlertTriangle, roles: ["logistics"] },
  { href: "/logistics/planner", label: "Planner", icon: Calendar, roles: ["logistics"] },
  { href: "/cms/orders", label: "Orders", icon: ShoppingCart, roles: ["cms"] },
  { href: "/cms/planner", label: "Planner", icon: Calendar, roles: ["cms"] },
  { href: "/admin/access-management", label: "Access Management", icon: Users, roles: ["admin"] },
  { href: "/admin/chat-analytics", label: "Chat Analytics", icon: BarChart, roles: ["admin"] },
  { href: "/admin/documents", label: "Documents", icon: FileText, roles: ["admin"] },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard, roles: ["admin"] },
  { href: "/ai-assistant", label: "AI Assistant", icon: MessageSquare, roles: ["admin", "sales", "logistics", "cms"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["admin", "sales", "logistics", "cms"] },
  { href: "/help", label: "Help", icon: HelpCircle, roles: ["admin", "sales", "logistics", "cms"] },
]

export function SideNavigation() {
  const pathname = usePathname()
  const { roles, loading: rolesLoading } = useUserRoles() // Corrected hook name

  if (rolesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading navigation...</p>
      </div>
    )
  }

  const filteredNavItems = navItems.filter((item) => {
    if (!item.roles) return true // If no roles specified, it's accessible to all
    return item.roles.some((role) => roles.includes(role))
  })

  return (
    <nav className="grid items-start px-4 text-sm font-medium">
      {filteredNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
            pathname.startsWith(item.href) ? "bg-muted text-primary" : "text-muted-foreground",
            item.tourId ? `data-[tour-id="${item.tourId}"]` : "", // Add data-tour-id
          )}
          data-tour-id={item.tourId} // Add data-tour-id for tour targeting
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
