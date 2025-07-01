"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Settings,
  User,
  HelpCircle,
  Bot,
  ClipboardList,
  Package,
  Users,
  FileText,
  BadgeInfo,
  CalendarCheck,
  MessageSquare,
  Briefcase,
  FolderKanban,
  FileStack,
  FileWarning,
  FileCheck,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function SideNavigation() {
  const pathname = usePathname()
  const currentSection = pathname.split("/")[1] // e.g., "sales", "admin", "logistics"

  const navigationItems = {
    dashboard: {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard",
      items: [],
    },
    sales: {
      icon: <ShoppingCart className="h-5 w-5" />,
      label: "Sales",
      href: "/sales",
      items: [
        { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/sales" },
        { icon: <CalendarCheck className="h-5 w-5" />, label: "Bookings", href: "/sales/bookings" },
        { icon: <Users className="h-5 w-5" />, label: "Clients", href: "/sales/clients" },
        { icon: <Package className="h-5 w-5" />, label: "Products", href: "/sales/products" },
        { icon: <FileText className="h-5 w-5" />, label: "Proposals", href: "/sales/proposals" },
        { icon: <Briefcase className="h-5 w-5" />, label: "Job Orders", href: "/sales/job-orders" },
        { icon: <FolderKanban className="h-5 w-5" />, label: "Project Campaigns", href: "/sales/project-campaigns" },
        { icon: <MessageSquare className="h-5 w-5" />, label: "Chat", href: "/sales/chat" },
        { icon: <ClipboardList className="h-5 w-5" />, label: "Planner", href: "/sales/planner" },
      ],
    },
    logistics: {
      icon: <Truck className="h-5 w-5" />,
      label: "Logistics",
      href: "/logistics",
      items: [
        { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/logistics" },
        { icon: <FileWarning className="h-5 w-5" />, label: "Alerts", href: "/logistics/alerts" },
        { icon: <FileCheck className="h-5 w-5" />, label: "Assignments", href: "/logistics/assignments" },
        { icon: <ClipboardList className="h-5 w-5" />, label: "Planner", href: "/logistics/planner" },
        { icon: <Package className="h-5 w-5" />, label: "Products", href: "/logistics/products" },
        { icon: <BadgeInfo className="h-5 w-5" />, label: "Sites", href: "/logistics/sites" },
      ],
    },
    cms: {
      icon: <FileStack className="h-5 w-5" />,
      label: "CMS",
      href: "/cms/dashboard",
      items: [
        { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/cms/dashboard" },
        { icon: <ShoppingCart className="h-5 w-5" />, label: "Orders", href: "/cms/orders" },
        { icon: <ClipboardList className="h-5 w-5" />, label: "Planner", href: "/cms/planner" },
      ],
    },
    admin: {
      icon: <Settings className="h-5 w-5" />,
      label: "Admin",
      href: "/admin",
      items: [
        { icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard", href: "/admin" },
        { icon: <Package className="h-5 w-5" />, label: "Inventory", href: "/admin/inventory" },
        { icon: <Users className="h-5 w-5" />, label: "Access Management", href: "/admin/access-management" },
      ],
    },
    account: {
      icon: <User className="h-5 w-5" />,
      label: "Account",
      href: "/account",
      items: [],
    },
    settings: {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/settings",
      items: [
        { icon: <Settings className="h-5 w-5" />, label: "General", href: "/settings" },
        { icon: <ClipboardList className="h-5 w-5" />, label: "Subscription", href: "/settings/subscription" },
      ],
    },
    aiAssistant: {
      icon: <Bot className="h-5 w-5" />,
      label: "AI Assistant",
      href: "/ai-assistant",
      items: [],
    },
    help: {
      icon: <HelpCircle className="h-5 w-5" />,
      label: "Help",
      href: "/help",
      items: [],
    },
  }

  const currentNavItem = Object.values(navigationItems).find((item) => pathname.startsWith(item.href))

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="#"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <span className="sr-only">ERP v2</span>
        </Link>
        <TooltipProvider>
          {Object.values(navigationItems).map((item) => (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 ${
                    pathname.startsWith(item.href) ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item.icon}
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground md:h-8 md:w-8 ${
                  pathname.startsWith("/settings") ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                }`}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  )
}
