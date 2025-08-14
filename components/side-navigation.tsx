"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Package,
  HardDrive,
  Wrench,
  Package2,
  ChevronDown,
  ChevronRight,
  Monitor,
  Server,
  Wifi,
  Shield,
  Users,
  Settings,
  BarChart3,
  Home,
  Building2,
  Truck,
  DollarSign,
  MessageSquare,
  Search,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NavigationItem {
  title: string
  icon: any
  href?: string
  badge?: string
  submenu?: NavigationItem[]
  isCollapsible?: boolean
}

export const SideNavigation = () => {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(["it-inventory"])

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionKey) ? prev.filter((key) => key !== sectionKey) : [...prev, sectionKey],
    )
  }

  const navigationItems: NavigationItem[] = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      title: "IT Department",
      icon: Monitor,
      submenu: [
        {
          title: "Overview",
          icon: BarChart3,
          href: "/it",
        },
        {
          title: "Inventory",
          icon: Package,
          isCollapsible: true,
          submenu: [
            {
              title: "All Items",
              icon: Package,
              href: "/it/inventory",
              badge: "125",
            },
            {
              title: "Assets",
              icon: HardDrive,
              href: "/it/inventory?type=assets",
              badge: "45",
            },
            {
              title: "Tools",
              icon: Wrench,
              href: "/it/inventory?type=tools",
              badge: "28",
            },
            {
              title: "Consumables",
              icon: Package2,
              href: "/it/inventory?type=consumables",
              badge: "52",
            },
          ],
        },
        {
          title: "User Management",
          icon: Users,
          href: "/it/user-management",
        },
        {
          title: "System Status",
          icon: Server,
          href: "/it/system-status",
        },
        {
          title: "Network",
          icon: Wifi,
          href: "/it/network",
        },
        {
          title: "Security",
          icon: Shield,
          href: "/it/security",
        },
      ],
    },
    {
      title: "Sales",
      icon: DollarSign,
      href: "/sales",
    },
    {
      title: "Logistics",
      icon: Truck,
      href: "/logistics",
    },
    {
      title: "Finance",
      icon: Building2,
      href: "/finance",
    },
    {
      title: "Messages",
      icon: MessageSquare,
      href: "/messages",
      badge: "3",
    },
  ]

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard"
    }
    return pathname.startsWith(href)
  }

  const isParentActive = (submenu?: NavigationItem[]) => {
    if (!submenu) return false
    return submenu.some((item) => (item.href ? isActive(item.href) : isParentActive(item.submenu)))
  }

  const renderNavigationItem = (item: NavigationItem, level = 0, parentKey?: string) => {
    const itemKey = parentKey
      ? `${parentKey}-${item.title.toLowerCase().replace(/\s+/g, "-")}`
      : item.title.toLowerCase().replace(/\s+/g, "-")
    const hasSubmenu = item.submenu && item.submenu.length > 0
    const isExpanded = expandedSections.includes(itemKey)
    const isItemActive = item.href ? isActive(item.href) : isParentActive(item.submenu)

    const paddingLeft = level === 0 ? "pl-3" : level === 1 ? "pl-6" : "pl-9"
    const textSize = level === 0 ? "text-sm" : "text-xs"
    const iconSize = level === 0 ? "h-4 w-4" : "h-3 w-3"

    if (hasSubmenu && item.isCollapsible) {
      return (
        <div key={itemKey} className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 h-8",
              paddingLeft,
              textSize,
              isItemActive && "bg-accent text-accent-foreground font-medium",
              "hover:bg-accent/50 transition-colors duration-200",
            )}
            onClick={() => toggleSection(itemKey)}
          >
            <item.icon className={iconSize} />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                {item.badge}
              </Badge>
            )}
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </Button>

          {isExpanded && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              {item.submenu?.map((subItem) => renderNavigationItem(subItem, level + 1, itemKey))}
            </div>
          )}
        </div>
      )
    }

    if (hasSubmenu) {
      return (
        <div key={itemKey} className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground",
              level > 0 && paddingLeft,
            )}
          >
            <item.icon className={iconSize} />
            {item.title}
          </div>
          <div className="space-y-1">
            {item.submenu?.map((subItem) => renderNavigationItem(subItem, level + 1, itemKey))}
          </div>
        </div>
      )
    }

    if (item.href) {
      return (
        <Link key={itemKey} href={item.href}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2 h-8",
              paddingLeft,
              textSize,
              isItemActive && "bg-accent text-accent-foreground font-medium",
              "hover:bg-accent/50 transition-colors duration-200",
            )}
          >
            <item.icon className={iconSize} />
            <span className="flex-1 text-left">{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="h-4 px-1.5 text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        </Link>
      )
    }

    return null
  }

  return (
    <nav className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">ERP System</h2>
            <p className="text-xs text-muted-foreground">IT Management</p>
          </div>
        </div>
      </div>

      {/* Quick Actions for IT */}
      {pathname.startsWith("/it") && (
        <div className="p-3 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Quick Actions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/it/inventory/new">
              <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-transparent">
                <Plus className="h-3 w-3 mr-1" />
                Add Item
              </Button>
            </Link>
            <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-transparent">
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">{navigationItems.map((item) => renderNavigationItem(item))}</div>
      </div>

      {/* IT Status Footer */}
      {pathname.startsWith("/it") && (
        <div className="p-3 border-t bg-muted/20">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">System Status</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Active Alerts</span>
              <Badge variant="destructive" className="h-4 px-1.5 text-xs">
                2
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-3 border-t">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
            <span className="text-xs text-primary-foreground font-medium">IT</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">IT Administrator</p>
            <p className="text-xs text-muted-foreground truncate">admin@company.com</p>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default SideNavigation
