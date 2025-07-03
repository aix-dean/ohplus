"use client"

import React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  HomeIcon,
  SettingsIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardListIcon,
  DollarSignIcon,
  MessageSquareIcon,
  BuildingIcon,
  MapPinIcon,
  LayoutDashboardIcon,
  FileTextIcon,
  BookOpenIcon,
  BellIcon,
  BriefcaseIcon,
  ShoppingCartIcon,
  FactoryIcon,
  MegaphoneIcon,
  LineChartIcon,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUserRoles, useIsAdmin } from "@/hooks/use-permissions"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  roles?: string[] // Roles that can access this item
  "data-tour-id"?: string // Optional ID for tour targeting
}

export function SideNavigation() {
  const pathname = usePathname()
  const { userRoles, loading: rolesLoading } = useUserRoles() // Corrected destructuring
  const { isAdmin, loading: isAdminLoading } = useIsAdmin() // Corrected destructuring

  if (rolesLoading || isAdminLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Loading navigation...</p>
      </div>
    )
  }

  const navItems: NavItem[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: HomeIcon,
      roles: ["Admin", "Sales", "Logistics", "CMS"],
    },
    {
      href: "/ai-assistant",
      label: "AI Assistant",
      icon: MessageSquareIcon,
      roles: ["Admin", "Sales", "Logistics", "CMS"],
    },
    {
      href: "/account",
      label: "Account",
      icon: UsersIcon,
      roles: ["Admin", "Sales", "Logistics", "CMS"],
    },
    {
      href: "/settings",
      label: "Settings",
      icon: SettingsIcon,
      roles: ["Admin", "Sales", "Logistics", "CMS"],
    },
    {
      href: "/help",
      label: "Help",
      icon: BookOpenIcon,
      roles: ["Admin", "Sales", "Logistics", "CMS"],
    },
    {
      href: "/sales/dashboard",
      label: "Sales Dashboard",
      icon: LayoutDashboardIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/clients",
      label: "Clients",
      icon: BuildingIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/products",
      label: "Products",
      icon: ShoppingCartIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/proposals",
      label: "Proposals",
      icon: FileTextIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/quotation-requests",
      label: "Quotation Requests",
      icon: DollarSignIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/job-orders",
      label: "Job Orders",
      icon: BriefcaseIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/bookings",
      label: "Bookings",
      icon: CalendarIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/project-campaigns",
      label: "Project Campaigns",
      icon: MegaphoneIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/chat",
      label: "Chat",
      icon: MessageSquareIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/bulletin-board",
      label: "Bulletin Board",
      icon: ClipboardListIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/sales/planner",
      label: "Planner",
      icon: CalendarIcon,
      roles: ["Admin", "Sales"],
    },
    {
      href: "/logistics/dashboard",
      label: "Logistics Dashboard",
      icon: LayoutDashboardIcon,
      roles: ["Admin", "Logistics"],
    },
    {
      href: "/logistics/sites",
      label: "Sites",
      icon: MapPinIcon,
      roles: ["Admin", "Logistics"],
    },
    {
      href: "/logistics/assignments",
      label: "Assignments",
      icon: ClipboardListIcon,
      roles: ["Admin", "Logistics"],
    },
    {
      href: "/logistics/alerts",
      label: "Alerts",
      icon: BellIcon,
      roles: ["Admin", "Logistics"],
    },
    {
      href: "/logistics/planner",
      label: "Planner",
      icon: CalendarIcon,
      roles: ["Admin", "Logistics"],
    },
    {
      href: "/cms/dashboard",
      label: "CMS Dashboard",
      icon: LayoutDashboardIcon,
      roles: ["Admin", "CMS"],
    },
    {
      href: "/cms/orders",
      label: "Orders",
      icon: ShoppingCartIcon,
      roles: ["Admin", "CMS"],
    },
    {
      href: "/cms/planner",
      label: "Planner",
      icon: CalendarIcon,
      roles: ["Admin", "CMS"],
    },
    {
      href: "/admin/dashboard",
      label: "Admin Dashboard",
      icon: LayoutDashboardIcon,
      roles: ["Admin"],
    },
    {
      href: "/admin/inventory",
      label: "Inventory",
      icon: FactoryIcon,
      roles: ["Admin"],
      "data-tour-id": "inventory-nav-item", // Tour target
    },
    {
      href: "/admin/access-management",
      label: "Access Management",
      icon: UsersIcon,
      roles: ["Admin"],
    },
    {
      href: "/admin/documents",
      label: "Documents",
      icon: FileTextIcon,
      roles: ["Admin"],
    },
    {
      href: "/admin/chat-analytics",
      label: "Chat Analytics",
      icon: LineChartIcon,
      roles: ["Admin"],
    },
    {
      href: "/admin/subscriptions",
      label: "Subscriptions",
      icon: DollarSignIcon,
      roles: ["Admin"],
    },
  ]

  const filteredNavItems = navItems.filter((item) => {
    // If item has no specific roles, it's visible to everyone
    if (!item.roles || item.roles.length === 0) {
      return true
    }
    // If user is admin, they see all admin-specific items and general items
    if (isAdmin) {
      return true
    }
    // Otherwise, check if user has any of the required roles
    return item.roles.some((role) => userRoles.includes(role))
  })

  // Group items by section for display
  const sections = [
    { title: "General", items: [] as NavItem[] },
    { title: "Sales", items: [] as NavItem[] },
    { title: "Logistics", items: [] as NavItem[] },
    { title: "CMS", items: [] as NavItem[] },
    { title: "Admin", items: [] as NavItem[] },
  ]

  filteredNavItems.forEach((item) => {
    if (item.href.startsWith("/sales")) {
      sections[1].items.push(item)
    } else if (item.href.startsWith("/logistics")) {
      sections[2].items.push(item)
    } else if (item.href.startsWith("/cms")) {
      sections[3].items.push(item)
    } else if (item.href.startsWith("/admin")) {
      sections[4].items.push(item)
    } else {
      sections[0].items.push(item) // General items
    }
  })

  return (
    <nav className="grid items-start px-4 text-sm font-medium lg:px-6">
      <TooltipProvider>
        {sections.map((section, sectionIndex) => (
          <React.Fragment key={section.title}>
            {section.items.length > 0 && (
              <div className="mt-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </div>
            )}
            {section.items.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      pathname.startsWith(item.href)
                        ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50"
                        : "",
                    )}
                    {...(item["data-tour-id"] && { "data-tour-id": item["data-tour-id"] })}
                  >
                    {React.createElement(item.icon, { className: "h-4 w-4" })}
                    {item.label}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ))}
          </React.Fragment>
        ))}
      </TooltipProvider>
    </nav>
  )
}
