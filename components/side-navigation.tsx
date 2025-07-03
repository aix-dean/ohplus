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
import { useUserRoles, useIsAdmin } from "@/hooks/use-permissions" // Corrected import

export function SideNavigation() {
  const pathname = usePathname()
  const { userRoles } = useUserRoles()
  const isAdmin = useIsAdmin()

  const isSales = userRoles.includes("Sales")
  const isLogistics = userRoles.includes("Logistics")
  const isCMS = userRoles.includes("CMS")

  const navItems = [
    {
      section: "General",
      items: [
        {
          href: "/dashboard",
          label: "Dashboard",
          icon: HomeIcon,
          active: pathname === "/dashboard",
          roles: ["Admin", "Sales", "Logistics", "CMS"],
        },
        {
          href: "/ai-assistant",
          label: "AI Assistant",
          icon: MessageSquareIcon,
          active: pathname.startsWith("/ai-assistant"),
          roles: ["Admin", "Sales", "Logistics", "CMS"],
        },
        {
          href: "/account",
          label: "Account",
          icon: UsersIcon,
          active: pathname.startsWith("/account"),
          roles: ["Admin", "Sales", "Logistics", "CMS"],
        },
        {
          href: "/settings",
          label: "Settings",
          icon: SettingsIcon,
          active: pathname.startsWith("/settings"),
          roles: ["Admin", "Sales", "Logistics", "CMS"],
        },
        {
          href: "/help",
          label: "Help",
          icon: BookOpenIcon,
          active: pathname.startsWith("/help"),
          roles: ["Admin", "Sales", "Logistics", "CMS"],
        },
      ],
    },
    {
      section: "Sales",
      items: [
        {
          href: "/sales/dashboard",
          label: "Dashboard",
          icon: LayoutDashboardIcon,
          active: pathname === "/sales/dashboard",
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/clients",
          label: "Clients",
          icon: BuildingIcon,
          active: pathname.startsWith("/sales/clients"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/products",
          label: "Products",
          icon: ShoppingCartIcon,
          active: pathname.startsWith("/sales/products"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/proposals",
          label: "Proposals",
          icon: FileTextIcon,
          active: pathname.startsWith("/sales/proposals"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/job-orders",
          label: "Job Orders",
          icon: BriefcaseIcon,
          active: pathname.startsWith("/sales/job-orders"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/bookings",
          label: "Bookings",
          icon: CalendarIcon,
          active: pathname.startsWith("/sales/bookings"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/project-campaigns",
          label: "Project Campaigns",
          icon: MegaphoneIcon,
          active: pathname.startsWith("/sales/project-campaigns"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/chat",
          label: "Chat",
          icon: MessageSquareIcon,
          active: pathname.startsWith("/sales/chat"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/bulletin-board",
          label: "Bulletin Board",
          icon: ClipboardListIcon,
          active: pathname.startsWith("/sales/bulletin-board"),
          roles: ["Admin", "Sales"],
        },
        {
          href: "/sales/planner",
          label: "Planner",
          icon: CalendarIcon,
          active: pathname.startsWith("/sales/planner"),
          roles: ["Admin", "Sales"],
        },
      ],
    },
    {
      section: "Logistics",
      items: [
        {
          href: "/logistics/dashboard",
          label: "Dashboard",
          icon: LayoutDashboardIcon,
          active: pathname === "/logistics/dashboard",
          roles: ["Admin", "Logistics"],
        },
        {
          href: "/logistics/sites",
          label: "Sites",
          icon: MapPinIcon,
          active: pathname.startsWith("/logistics/sites"),
          roles: ["Admin", "Logistics"],
        },
        {
          href: "/logistics/assignments",
          label: "Assignments",
          icon: ClipboardListIcon,
          active: pathname.startsWith("/logistics/assignments"),
          roles: ["Admin", "Logistics"],
        },
        {
          href: "/logistics/alerts",
          label: "Alerts",
          icon: BellIcon,
          active: pathname.startsWith("/logistics/alerts"),
          roles: ["Admin", "Logistics"],
        },
        {
          href: "/logistics/planner",
          label: "Planner",
          icon: CalendarIcon,
          active: pathname.startsWith("/logistics/planner"),
          roles: ["Admin", "Logistics"],
        },
      ],
    },
    {
      section: "CMS",
      items: [
        {
          href: "/cms/dashboard",
          label: "Dashboard",
          icon: LayoutDashboardIcon,
          active: pathname === "/cms/dashboard",
          roles: ["Admin", "CMS"],
        },
        {
          href: "/cms/orders",
          label: "Orders",
          icon: ShoppingCartIcon,
          active: pathname.startsWith("/cms/orders"),
          roles: ["Admin", "CMS"],
        },
        {
          href: "/cms/planner",
          label: "Planner",
          icon: CalendarIcon,
          active: pathname.startsWith("/cms/planner"),
          roles: ["Admin", "CMS"],
        },
      ],
    },
    {
      section: "Admin",
      items: [
        {
          href: "/admin/dashboard",
          label: "Dashboard",
          icon: LayoutDashboardIcon,
          active: pathname === "/admin/dashboard",
          roles: ["Admin"],
        },
        {
          href: "/admin/inventory",
          label: "Inventory",
          icon: FactoryIcon,
          active: pathname.startsWith("/admin/inventory"),
          roles: ["Admin"],
          "data-tour-id": "inventory-nav-item", // Tour target
        },
        {
          href: "/admin/access-management",
          label: "Access Management",
          icon: UsersIcon,
          active: pathname.startsWith("/admin/access-management"),
          roles: ["Admin"],
        },
        {
          href: "/admin/documents",
          label: "Documents",
          icon: FileTextIcon,
          active: pathname.startsWith("/admin/documents"),
          roles: ["Admin"],
        },
        {
          href: "/admin/chat-analytics",
          label: "Chat Analytics",
          icon: LineChartIcon,
          active: pathname.startsWith("/admin/chat-analytics"),
          roles: ["Admin"],
        },
        {
          href: "/admin/subscriptions",
          label: "Subscriptions",
          icon: DollarSignIcon,
          active: pathname.startsWith("/admin/subscriptions"),
          roles: ["Admin"],
        },
      ],
    },
  ]

  const filteredNavItems = navItems
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (isAdmin) return true // Admin sees everything
        return item.roles.some((role) => userRoles.includes(role))
      }),
    }))
    .filter((section) => section.items.length > 0) // Remove empty sections

  return (
    <nav className="grid items-start px-4 text-sm font-medium lg:px-6">
      <TooltipProvider>
        {filteredNavItems.map((section, sectionIndex) => (
          <React.Fragment key={section.section}>
            {section.items.length > 0 && (
              <div className="mt-4 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.section}
              </div>
            )}
            {section.items.map((item) => (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                      item.active && "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50",
                    )}
                    {...(item["data-tour-id"] && { "data-tour-id": item["data-tour-id"] })}
                  >
                    <item.icon className="h-4 w-4" />
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
