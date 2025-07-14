"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  BarChart,
  FileText,
  Settings,
  Bell,
  Calendar,
  MessageSquare,
  ClipboardList,
  DollarSign,
  FileCheck,
  MapPin,
  Truck,
  Megaphone,
  BookOpen,
  FileWarning,
  UserCog,
  Key,
  CreditCard,
  Bot,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SideNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "sales", "logistics", "cms"],
    },
    {
      title: "Sales",
      icon: DollarSign,
      roles: ["admin", "sales"],
      subItems: [
        {
          title: "Dashboard",
          href: "/sales/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Clients",
          href: "/sales/clients",
          icon: Users,
        },
        {
          title: "Products",
          href: "/sales/products",
          icon: Package,
        },
        {
          title: "Proposals",
          href: "/sales/proposals",
          icon: FileText,
        },
        {
          title: "Quotations",
          href: "/sales/quotations-list", // Updated link
          icon: FileCheck,
        },
        {
          title: "Bookings",
          href: "/sales/bookings",
          icon: ClipboardList,
        },
        {
          title: "Job Orders",
          href: "/sales/job-orders",
          icon: ShoppingCart,
        },
        {
          title: "Project Campaigns",
          href: "/sales/project-campaigns",
          icon: Megaphone,
        },
        {
          title: "Planner",
          href: "/sales/planner",
          icon: Calendar,
        },
        {
          title: "Chat",
          href: "/sales/chat",
          icon: MessageSquare,
        },
        {
          title: "Bulletin Board",
          href: "/sales/bulletin-board",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "Logistics",
      icon: Truck,
      roles: ["admin", "logistics"],
      subItems: [
        {
          title: "Dashboard",
          href: "/logistics/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Sites",
          href: "/logistics/sites",
          icon: MapPin,
        },
        {
          title: "Service Assignments",
          href: "/logistics/service-assignments",
          icon: ClipboardList,
        },
        {
          title: "Reports",
          href: "/logistics/reports",
          icon: FileText,
        },
        {
          title: "Planner",
          href: "/logistics/planner",
          icon: Calendar,
        },
        {
          title: "Alerts",
          href: "/logistics/alerts",
          icon: Bell,
        },
        {
          title: "Bulletin Board",
          href: "/logistics/bulletin-board",
          icon: BookOpen,
        },
      ],
    },
    {
      title: "CMS",
      icon: FileText,
      roles: ["admin", "cms"],
      subItems: [
        {
          title: "Dashboard",
          href: "/cms/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Content",
          href: "/cms/content",
          icon: FileText,
        },
        {
          title: "Orders",
          href: "/cms/orders",
          icon: ShoppingCart,
        },
        {
          title: "Planner",
          href: "/cms/planner",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Admin",
      icon: UserCog,
      roles: ["admin"],
      subItems: [
        {
          title: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "User Management",
          href: "/admin/user-management",
          icon: Users,
        },
        {
          title: "Access Management",
          href: "/admin/access-management",
          icon: Key,
        },
        {
          title: "Inventory",
          href: "/admin/inventory",
          icon: Package,
        },
        {
          title: "Invitation Codes",
          href: "/admin/invitation-codes",
          icon: FileCheck,
        },
        {
          title: "Subscriptions",
          href: "/admin/subscriptions",
          icon: CreditCard,
        },
        {
          title: "Documents",
          href: "/admin/documents",
          icon: FileText,
        },
        {
          title: "Chat Analytics",
          href: "/admin/chat-analytics",
          icon: BarChart,
        },
      ],
    },
    {
      title: "AI Assistant",
      href: "/ai-assistant",
      icon: Bot,
      roles: ["admin", "sales", "logistics", "cms"],
    },
    {
      title: "Account",
      href: "/account",
      icon: Users,
      roles: ["admin", "sales", "logistics", "cms"],
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      roles: ["admin", "sales", "logistics", "cms"],
    },
    {
      title: "Help",
      href: "/help",
      icon: FileWarning,
      roles: ["admin", "sales", "logistics", "cms"],
    },
  ]

  const getAccordionValue = (path: string) => {
    const rootPath = `/${path.split("/")[1]}`
    return (
      navItems.find((item) => item.href === rootPath || item.subItems?.some((sub) => sub.href.startsWith(rootPath)))
        ?.title || ""
    )
  }

  const activeAccordionValue = getAccordionValue(pathname)

  return (
    <ScrollArea className="h-full py-6">
      <nav className="grid items-start px-4 text-sm font-medium">
        <Accordion type="single" collapsible value={activeAccordionValue}>
          {navItems.map((item) => {
            if (item.subItems) {
              const isActiveGroup = item.subItems.some((sub) => pathname.startsWith(sub.href))
              return (
                <AccordionItem value={item.title} key={item.title} className="border-none">
                  <AccordionTrigger
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 [&[data-state=open]>svg]:rotate-90",
                      isActiveGroup && "bg-gray-100 text-gray-900",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 ml-4",
                          pathname.startsWith(subItem.href) && "bg-gray-100 text-gray-900",
                        )}
                        href={subItem.href}
                      >
                        <subItem.icon className="h-4 w-4" />
                        {subItem.title}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              )
            }
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900",
                  isActive && "bg-gray-100 text-gray-900",
                )}
                href={item.href}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </Accordion>
      </nav>
    </ScrollArea>
  )
}
