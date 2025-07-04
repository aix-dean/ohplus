"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  FileText,
  Bot,
  MapPin,
  CloudSun,
  Search,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Handshake,
  DollarSign,
  UserCog,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronUp } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useIsAdmin } from "@/hooks/use-is-admin"
import { usePermissions } from "@/hooks/use-permissions"
import { useUnreadMessagesAdvanced } from "@/hooks/use-unread-messages-advanced"

export function SideNavigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const isAdmin = useIsAdmin()
  const { hasPermission } = usePermissions()
  const { unreadCount: unreadSalesChatCount } = useUnreadMessagesAdvanced("sales-chat")
  const { unreadCount: unreadAssistantChatCount } = useUnreadMessagesAdvanced("assistant-chat")

  const isLinkActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="#"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <Package2 className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">OH!Plus</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/admin/dashboard")}>
                  <Link href="/admin/dashboard">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/bookings")}>
                  <Link href="/sales/bookings">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Bookings</span>
                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">6</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/clients")}>
                  <Link href="/sales/clients">
                    <Users className="h-5 w-5" />
                    <span>Clients</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/products")}>
                  <Link href="/sales/products">
                    <Package className="h-5 w-5" />
                    <span>Products</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/job-orders")}>
                  <Link href="/sales/job-orders">
                    <ClipboardList className="h-5 w-5" />
                    <span>Job Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/proposals")}>
                  <Link href="/sales/proposals">
                    <FileText className="h-5 w-5" />
                    <span>Proposals</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/project-campaigns")}>
                  <Link href="/sales/project-campaigns">
                    <Megaphone className="h-5 w-5" />
                    <span>Project Campaigns</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/sales/chat")}>
                  <Link href="/sales/chat">
                    <Bot className="h-5 w-5" />
                    <span>Sales Chat</span>
                    {unreadSalesChatCount > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {unreadSalesChatCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Logistics</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/logistics/dashboard")}>
                  <Link href="/logistics/dashboard">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/logistics/sites")} data-tour-id="inventory-link">
                  <Link href="/logistics/sites">
                    <MapPin className="h-5 w-5" />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/logistics/assignments")}>
                  <Link href="/logistics/assignments">
                    <Handshake className="h-5 w-5" />
                    <span>Assignments</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/logistics/planner")}>
                  <Link href="/logistics/planner">
                    <CalendarDays className="h-5 w-5" />
                    <span>Planner</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/logistics/alerts")}>
                  <Link href="/logistics/alerts">
                    <Bell className="h-5 w-5" />
                    <span>Alerts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>CMS</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/cms/dashboard")}>
                  <Link href="/cms/dashboard">
                    <Home className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/cms/orders")}>
                  <Link href="/cms/orders">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Orders</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/cms/planner")}>
                  <Link href="/cms/planner">
                    <CalendarDays className="h-5 w-5" />
                    <span>Planner</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/ai-assistant")}>
                  <Link href="/ai-assistant">
                    <Bot className="h-5 w-5" />
                    <span>AI Assistant</span>
                    {unreadAssistantChatCount > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {unreadAssistantChatCount}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/weather-forecast")}>
                  <Link href="/weather-forecast">
                    <CloudSun className="h-5 w-5" />
                    <span>Weather Forecast</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isLinkActive("/search")}>
                  <Link href="/search">
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && hasPermission("admin:access") && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isLinkActive("/admin/access-management")}>
                      <Link href="/admin/access-management">
                        <UserCog className="h-5 w-5" />
                        <span>Access Management</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isLinkActive("/admin/chat-analytics")}>
                      <Link href="/admin/chat-analytics">
                        <LineChart className="h-5 w-5" />
                        <span>Chat Analytics</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isLinkActive("/admin/documents")}>
                      <Link href="/admin/documents">
                        <FileText className="h-5 w-5" />
                        <span>Documents</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isLinkActive("/admin/inventory")}>
                      <Link href="/admin/inventory">
                        <Package className="h-5 w-5" />
                        <span>Inventory</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isLinkActive("/admin/subscriptions")}>
                      <Link href="/admin/subscriptions">
                        <DollarSign className="h-5 w-5" />
                        <span>Subscriptions</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <Users /> {user?.email || "Guest"}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <span>Account</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
