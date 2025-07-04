"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Users,
  Settings,
  MessageSquare,
  BarChart,
  FileText,
  ShoppingCart,
  Briefcase,
  DollarSign,
  Calendar,
  ClipboardList,
  Building,
  Megaphone,
  Handshake,
  HelpCircle,
  LogOut,
  Package2,
  ChevronUp,
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
import { useAuth } from "@/contexts/auth-context"
import { usePermission, useIsAdmin } from "@/hooks/use-permissions"
import { useUnreadMessagesAdvanced } from "@/hooks/use-unread-messages-advanced"

export function SideNavigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { isAdmin, loading: isAdminLoading } = useIsAdmin()
  const { unreadCount: unreadSalesChatCount } = useUnreadMessagesAdvanced("sales-chat")
  const { unreadCount: unreadAssistantChatCount } = useUnreadMessagesAdvanced("assistant-chat")

  // Permissions for various modules
  const { hasAccess: canViewAdminDashboard } = usePermission("view_dashboard", "admin", "view")
  const { hasAccess: canViewAccessManagement } = usePermission("view_access_management", "admin", "view")
  const { hasAccess: canViewChatAnalytics } = usePermission("view_chat_analytics", "admin", "view")
  const { hasAccess: canViewDocuments } = usePermission("view_documents", "admin", "view")
  const { hasAccess: canViewInventory } = usePermission("view_inventory", "admin", "view")
  const { hasAccess: canViewProducts } = usePermission("view_products", "admin", "view")
  const { hasAccess: canViewSubscriptions } = usePermission("view_subscriptions", "admin", "view")
  const { hasAccess: canViewAIAssistant } = usePermission("view_ai_assistant", "ai-assistant", "view")
  const { hasAccess: canViewSalesDashboard } = usePermission("view_dashboard", "sales", "view")
  const { hasAccess: canViewSalesClients } = usePermission("view_clients", "sales", "view")
  const { hasAccess: canViewSalesProducts } = usePermission("view_products", "sales", "view")
  const { hasAccess: canViewSalesProposals } = usePermission("view_proposals", "sales", "view")
  const { hasAccess: canViewSalesQuotations } = usePermission("view_quotations", "sales", "view")
  const { hasAccess: canViewSalesJobOrders } = usePermission("view_job_orders", "sales", "view")
  const { hasAccess: canViewSalesBookings } = usePermission("view_bookings", "sales", "view")
  const { hasAccess: canViewSalesProjectCampaigns } = usePermission("view_project_campaigns", "sales", "view")
  const { hasAccess: canViewSalesChat } = usePermission("view_chat", "sales", "view")
  const { hasAccess: canViewSalesPlanner } = usePermission("view_planner", "sales", "view")
  const { hasAccess: canViewLogisticsDashboard } = usePermission("view_dashboard", "logistics", "view")
  const { hasAccess: canViewLogisticsAssignments } = usePermission("view_assignments", "logistics", "view")
  const { hasAccess: canViewLogisticsPlanner } = usePermission("view_planner", "logistics", "view")
  const { hasAccess: canViewLogisticsAlerts } = usePermission("view_alerts", "logistics", "view")
  const { hasAccess: canViewLogisticsSites } = usePermission("view_sites", "logistics", "view")
  const { hasAccess: canViewCMSDashboard } = usePermission("view_dashboard", "cms", "view")
  const { hasAccess: canViewCMSOrders } = usePermission("view_orders", "cms", "view")
  const { hasAccess: canViewCMSPlanner } = usePermission("view_planner", "cms", "view")
  const { hasAccess: canViewAccountSettings } = usePermission("view_account_settings", "settings", "view")
  const { hasAccess: canViewHelp } = usePermission("view_help", "help", "view")

  const isLinkActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const navigationItems = React.useMemo(
    () => [
      {
        label: "Admin",
        visible: isAdmin, // Only visible to admins
        items: [
          {
            title: "Dashboard",
            icon: LayoutDashboard,
            href: "/admin/dashboard",
            active: pathname === "/admin/dashboard",
            visible: canViewAdminDashboard,
          },
          {
            title: "Access Management",
            icon: Users,
            href: "/admin/access-management",
            active: pathname.startsWith("/admin/access-management"),
            visible: canViewAccessManagement,
          },
          {
            title: "Chat Analytics",
            icon: BarChart,
            href: "/admin/chat-analytics",
            active: pathname.startsWith("/admin/chat-analytics"),
            visible: canViewChatAnalytics,
          },
          {
            title: "Documents",
            icon: FileText,
            href: "/admin/documents",
            active: pathname.startsWith("/admin/documents"),
            visible: canViewDocuments,
          },
          {
            title: "Inventory",
            icon: Package,
            href: "/admin/inventory",
            active: pathname.startsWith("/admin/inventory"),
            visible: canViewInventory,
            "data-tour-id": "inventory-link", // Tour target
          },
          {
            title: "Products",
            icon: ShoppingCart,
            href: "/admin/products",
            active: pathname.startsWith("/admin/products"),
            visible: canViewProducts,
          },
          {
            title: "Subscriptions",
            icon: DollarSign,
            href: "/admin/subscriptions",
            active: pathname.startsWith("/admin/subscriptions"),
            visible: canViewSubscriptions,
          },
        ],
      },
      {
        label: "Sales",
        visible: true, // Assuming sales module is generally visible
        items: [
          {
            title: "Dashboard",
            icon: LayoutDashboard,
            href: "/sales/dashboard",
            active: pathname === "/sales/dashboard",
            visible: canViewSalesDashboard,
          },
          {
            title: "Clients",
            icon: Users,
            href: "/sales/clients",
            active: pathname.startsWith("/sales/clients"),
            visible: canViewSalesClients,
          },
          {
            title: "Products",
            icon: Package,
            href: "/sales/products",
            active: pathname.startsWith("/sales/products"),
            visible: canViewSalesProducts,
          },
          {
            title: "Proposals",
            icon: Briefcase,
            href: "/sales/proposals",
            active: pathname.startsWith("/sales/proposals"),
            visible: canViewSalesProposals,
          },
          {
            title: "Quotations",
            icon: DollarSign,
            href: "/sales/quotations",
            active: pathname.startsWith("/sales/quotations"),
            visible: canViewSalesQuotations,
          },
          {
            title: "Job Orders",
            icon: ClipboardList,
            href: "/sales/job-orders",
            active: pathname.startsWith("/sales/job-orders"),
            visible: canViewSalesJobOrders,
          },
          {
            title: "Bookings",
            icon: Calendar,
            href: "/sales/bookings",
            active: pathname.startsWith("/sales/bookings"),
            visible: canViewSalesBookings,
          },
          {
            title: "Project Campaigns",
            icon: Megaphone,
            href: "/sales/project-campaigns",
            active: pathname.startsWith("/sales/project-campaigns"),
            visible: canViewSalesProjectCampaigns,
          },
          {
            title: "Chat",
            icon: MessageSquare,
            href: "/sales/chat",
            active: pathname.startsWith("/sales/chat"),
            visible: canViewSalesChat,
            badge: unreadSalesChatCount,
          },
          {
            title: "Planner",
            icon: Calendar,
            href: "/sales/planner",
            active: pathname.startsWith("/sales/planner"),
            visible: canViewSalesPlanner,
          },
        ],
      },
      {
        label: "Logistics",
        visible: true,
        items: [
          {
            title: "Dashboard",
            icon: LayoutDashboard,
            href: "/logistics/dashboard",
            active: pathname === "/logistics/dashboard",
            visible: canViewLogisticsDashboard,
          },
          {
            title: "Assignments",
            icon: ClipboardList,
            href: "/logistics/assignments",
            active: pathname.startsWith("/logistics/assignments"),
            visible: canViewLogisticsAssignments,
          },
          {
            title: "Planner",
            icon: Calendar,
            href: "/logistics/planner",
            active: pathname.startsWith("/logistics/planner"),
            visible: canViewLogisticsPlanner,
          },
          {
            title: "Alerts",
            icon: MessageSquare,
            href: "/logistics/alerts",
            active: pathname.startsWith("/logistics/alerts"),
            visible: canViewLogisticsAlerts,
          },
          {
            title: "Sites",
            icon: Building,
            href: "/logistics/sites",
            active: pathname.startsWith("/logistics/sites"),
            visible: canViewLogisticsSites,
          },
        ],
      },
      {
        label: "CMS",
        visible: true,
        items: [
          {
            title: "Dashboard",
            icon: LayoutDashboard,
            href: "/cms/dashboard",
            active: pathname === "/cms/dashboard",
            visible: canViewCMSDashboard,
          },
          {
            title: "Orders",
            icon: ShoppingCart,
            href: "/cms/orders",
            active: pathname.startsWith("/cms/orders"),
            visible: canViewCMSOrders,
          },
          {
            title: "Planner",
            icon: Calendar,
            href: "/cms/planner",
            active: pathname.startsWith("/cms/planner"),
            visible: canViewCMSPlanner,
          },
        ],
      },
      {
        label: "AI Assistant",
        visible: true,
        items: [
          {
            title: "Assistant",
            icon: Handshake,
            href: "/ai-assistant",
            active: pathname.startsWith("/ai-assistant"),
            visible: canViewAIAssistant,
            badge: unreadAssistantChatCount,
          },
        ],
      },
      {
        label: "General",
        visible: true,
        items: [
          {
            title: "Account Settings",
            icon: Settings,
            href: "/account",
            active: pathname.startsWith("/account"),
            visible: canViewAccountSettings,
          },
          {
            title: "Help",
            icon: HelpCircle,
            href: "/help",
            active: pathname.startsWith("/help"),
            visible: canViewHelp,
          },
          {
            title: "Logout",
            icon: LogOut,
            href: "/logout", // Assuming a logout route
            active: false,
            visible: true,
            onClick: logout, // Add logout handler
          },
        ],
      },
    ],
    [
      pathname,
      isAdmin,
      canViewAdminDashboard,
      canViewAccessManagement,
      canViewChatAnalytics,
      canViewDocuments,
      canViewInventory,
      canViewProducts,
      canViewSubscriptions,
      canViewAIAssistant,
      canViewSalesDashboard,
      canViewSalesClients,
      canViewSalesProducts,
      canViewSalesProposals,
      canViewSalesQuotations,
      canViewSalesJobOrders,
      canViewSalesBookings,
      canViewSalesProjectCampaigns,
      canViewSalesChat,
      canViewSalesPlanner,
      canViewLogisticsDashboard,
      canViewLogisticsAssignments,
      canViewLogisticsPlanner,
      canViewLogisticsAlerts,
      canViewLogisticsSites,
      canViewCMSDashboard,
      canViewCMSOrders,
      canViewCMSPlanner,
      canViewAccountSettings,
      canViewHelp,
      unreadSalesChatCount,
      unreadAssistantChatCount,
      logout,
    ],
  )

  if (isAdminLoading) {
    return null // Or a loading spinner
  }

  // The Sidebar component from components/ui/sidebar already handles the mobile/desktop logic
  // and uses useSidebar internally. So, we just render it directly.
  return (
    <Sidebar collapsible="icon" side="left">
      <SidebarHeader className="p-2">
        <div className="flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
            <Package2 className="h-6 w-6" />
            <span className="text-lg">ERP v2</span>
          </Link>
          {/* The close button for mobile sheet is handled by Sidebar component itself */}
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent className="flex-1 py-2">
        {navigationItems.map(
          (group, groupIndex) =>
            group.visible && (
              <React.Fragment key={groupIndex}>
                <SidebarGroup>
                  <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.items.map(
                        (item, itemIndex) =>
                          item.visible && (
                            <SidebarMenuItem key={itemIndex}>
                              <SidebarMenuButton
                                asChild
                                isActive={item.active}
                                {...(item["data-tour-id"] && { "data-tour-id": item["data-tour-id"] })}
                                onClick={item.onClick} // Pass onClick handler
                              >
                                <Link href={item.href}>
                                  <item.icon className="h-4 w-4" />
                                  <span>{item.title}</span>
                                  {item.badge !== undefined && item.badge > 0 && (
                                    <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ),
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
                {groupIndex < navigationItems.length - 1 && <SidebarSeparator />}
              </React.Fragment>
            ),
        )}
      </SidebarContent>
      <SidebarFooter className="p-2">
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
