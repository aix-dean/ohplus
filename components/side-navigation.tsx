"use client"

import { Badge } from "@/components/ui/badge"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Package,
  Users,
  Settings,
  Bell,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  DollarSign,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface NavigationItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: number
}

interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

const navigationItems: Record<string, NavigationGroup[]> = {
  sales: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/sales/dashboard", icon: LayoutDashboard },
        { title: "Bookings", href: "/sales/bookings", icon: ClipboardList },
        { title: "Proposals", href: "/sales/proposals", icon: FileText },
        { title: "Products", href: "/sales/products", icon: Package },
      ],
    },
    {
      label: "Management",
      items: [
        { title: "Clients", href: "/sales/clients", icon: Users },
        { title: "Job Orders", href: "/sales/job-orders", icon: ClipboardList },
        { title: "Project Campaigns", href: "/sales/project-campaigns", icon: LayoutDashboard },
        { title: "Planner", href: "/sales/planner", icon: CalendarIcon },
      ],
    },
    {
      label: "Communication",
      items: [
        { title: "Chat", href: "/sales/chat", icon: MessageSquare },
        { title: "Bulletin Board", href: "/sales/bulletin-board", icon: Megaphone },
      ],
    },
  ],
  logistics: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", href: "/logistics/dashboard", icon: LayoutDashboard },
        { title: "Sites", href: "/logistics/sites", icon: MapPin },
        { title: "Products", href: "/logistics/products", icon: Package },
      ],
    },
    {
      label: "Operations",
      items: [
        { title: "Assignments", href: "/logistics/assignments", icon: ClipboardList },
        { title: "Alerts", href: "/logistics/alerts", icon: Bell },
        { title: "Planner", href: "/logistics/planner", icon: CalendarIcon },
      ],
    },
  ],
  cms: [
    {
      label: "Content Management",
      items: [
        { title: "Dashboard", href: "/cms/dashboard", icon: LayoutDashboard },
        { title: "Orders", href: "/cms/orders", icon: ClipboardList },
        { title: "Planner", href: "/cms/planner", icon: CalendarIcon },
      ],
    },
  ],
  admin: [
    // This section will be custom rendered below
    {
      label: "Admin",
      items: [
        { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Access Management", href: "/admin/access-management", icon: Users },
        { title: "Chat Analytics", href: "/admin/chat-analytics", icon: BarChart },
        { title: "Inventory", href: "/admin/inventory", icon: Package },
        { title: "Subscriptions", href: "/admin/subscriptions", icon: DollarSign }, // Updated path
      ],
    },
  ],
  settings: [
    {
      label: "Settings",
      items: [
        { title: "Account", href: "/account", icon: Settings },
        // Subscription moved to admin
      ],
    },
  ],
}

export function SideNavigation() {
  const pathname = usePathname()
  const currentSection = pathname.split("/")[1] || "sales" // Default to 'sales' if no section

  const getIsActive = (href: string) => pathname === href

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2">
          <img src="/ohplus-new-logo.png" alt="OH Plus Logo" className="h-8 w-auto" />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          {currentSection === "admin" ? (
            // Custom layout for Admin Dashboard
            <div className="p-4 space-y-6">
              <div className="bg-blue-500 text-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Notification</h3>
                  <Bell className="h-5 w-5" />
                </div>
                <p className="text-sm text-blue-100">No notification for now.</p>
                <Button variant="link" className="text-blue-100 p-0 h-auto mt-2">
                  See All
                </Button>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">To Go</h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={getIsActive("/admin/dashboard")}>
                      <Link href="/admin/dashboard">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={getIsActive("/admin/bulletin-board")}>
                      <Link href="/admin/bulletin-board">
                        <ClipboardList className="mr-2 h-4 w-4" />
                        Bulletin Board
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-gray-800 mb-3">To Do</h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={getIsActive("/admin/documents")}>
                      <Link href="/admin/documents">
                        <FileText className="mr-2 h-4 w-4" />
                        Documents
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={getIsActive("/admin/inventory")}>
                      <Link href="/admin/inventory">
                        <Package className="mr-2 h-4 w-4" />
                        Inventory
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={getIsActive("/admin/user-management")}>
                      <Link href="/admin/user-management">
                        <Users className="mr-2 h-4 w-4" />
                        User Management
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={getIsActive("/admin/subscriptions")}>
                      <Link href="/admin/subscriptions">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Subscription
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>

              <div className="bg-purple-600 text-white p-4 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Intelligence</h3>
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Button variant="ghost" size="icon" className="text-white hover:bg-purple-700">
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="flex gap-2">
                    <div className="h-12 w-20 bg-purple-700 rounded-md" />
                    <div className="h-12 w-20 bg-purple-700 rounded-md" />
                  </div>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-purple-700">
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                <Button variant="link" className="text-purple-100 p-0 h-auto mt-2">
                  See All
                </Button>
              </div>
            </div>
          ) : (
            // Existing navigation for other sections
            Object.entries(navigationItems).map(([section, groups]) => (
              <React.Fragment key={section}>
                {section === currentSection && (
                  <>
                    {groups.map((group, groupIndex) => (
                      <SidebarGroup key={groupIndex}>
                        <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                          <SidebarMenu>
                            {group.items.map((item, itemIndex) => (
                              <SidebarMenuItem key={itemIndex}>
                                <SidebarMenuButton asChild isActive={getIsActive(item.href)}>
                                  <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                    {item.badge !== undefined && (
                                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                        {item.badge}
                                      </Badge>
                                    )}
                                  </Link>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </SidebarMenu>
                        </SidebarGroupContent>
                      </SidebarGroup>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarRail>
        <TooltipProvider>
          {Object.entries(navigationItems).map(([section, groups]) => (
            <React.Fragment key={section}>
              {groups.map((group, groupIndex) => (
                <React.Fragment key={groupIndex}>
                  {group.items.map((item, itemIndex) => (
                    <Tooltip key={itemIndex}>
                      <TooltipTrigger asChild>
                        <SidebarTrigger asChild>
                          <Link href={item.href} className={cn(getIsActive(item.href) && "bg-muted")}>
                            <item.icon className="h-5 w-5" />
                            <span className="sr-only">{item.title}</span>
                          </Link>
                        </SidebarTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  ))}
                </React.Fragment>
              ))}
            </React.Fragment>
          ))}
        </TooltipProvider>
      </SidebarRail>
    </Sidebar>
  )
}

import { CalendarIcon, MessageSquare, Megaphone, MapPin, BarChart } from "lucide-react"
