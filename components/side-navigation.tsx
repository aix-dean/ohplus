"use client"

import { Home, LayoutDashboard, Package, Settings, ShoppingBag, Users } from "lucide-react"
import { usePathname } from "next/navigation"

import type { MainNavItem, SidebarNavItem } from "@/types"

interface DashboardConfig {
  mainNav: MainNavItem[]
  sidebarNav: SidebarNavItem[]
}

export const dashboardConfig: DashboardConfig = {
  mainNav: [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Business",
      href: "/business",
    },
  ],
  sidebarNav: [
    {
      title: "General",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Settings",
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
    {
      title: "Business",
      items: [
        {
          title: "Overview",
          href: "/business",
          icon: Home,
          current: usePathname() === "/business",
        },
        {
          name: "Inventory",
          href: "/business/inventory",
          icon: Package,
          current: usePathname() === "/business/inventory" || usePathname().startsWith("/business/inventory/"),
        },
        {
          title: "Customers",
          href: "/business/customers",
          icon: Users,
          current: usePathname() === "/business/customers",
        },
        {
          title: "Orders",
          href: "/business/orders",
          icon: ShoppingBag,
          current: usePathname() === "/business/orders",
        },
      ],
    },
  ],
}
