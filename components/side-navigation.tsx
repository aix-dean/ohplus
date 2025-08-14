"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Package,
  HardDrive,
  Wrench,
  Package2,
  ChevronDown,
  ChevronRight,
  Monitor,
  Database,
  Settings,
  Plus,
  Search,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

function SideNavigation() {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(["it", "inventory"])
  const [searchQuery, setSearchQuery] = useState("")

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId],
    )
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")
  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId)

  const inventoryItems = [
    {
      title: "Assets",
      icon: HardDrive,
      href: "/it/inventory?type=assets",
      count: 45,
      color: "bg-blue-500",
    },
    {
      title: "Tools",
      icon: Wrench,
      href: "/it/inventory?type=tools",
      count: 23,
      color: "bg-green-500",
    },
    {
      title: "Consumables",
      icon: Package2,
      href: "/it/inventory?type=consumables",
      count: 67,
      color: "bg-orange-500",
    },
  ]

  const hardwareItems = [
    {
      title: "Assets",
      icon: HardDrive,
      href: "/hardware/assets",
      count: 45,
      color: "bg-blue-500",
    },
    {
      title: "Tools",
      icon: Wrench,
      href: "/hardware/tools",
      count: 23,
      color: "bg-green-500",
    },
    {
      title: "Consumables",
      icon: Package2,
      href: "/hardware/consumables",
      count: 67,
      color: "bg-orange-500",
    },
  ]

  const navigationItems = [
    {
      title: "Dashboard",
      icon: Monitor,
      href: "/dashboard",
    },
    {
      title: "IT",
      icon: Database,
      href: "/it",
      id: "it",
      submenu: [
        {
          title: "Inventory",
          icon: Package,
          href: "/it/inventory",
          id: "inventory",
          submenu: inventoryItems,
        },
        {
          title: "User Management",
          icon: Settings,
          href: "/it/user-management",
        },
      ],
    },
    {
      title: "Hardware",
      icon: HardDrive,
      href: "/hardware",
      id: "hardware",
      submenu: hardwareItems,
    },
  ]

  const filteredInventoryItems = inventoryItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredHardwareItems = hardwareItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <nav className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Navigation</h2>

        {navigationItems.map((item) => (
          <div key={item.title} className="mb-2">
            <div className="flex items-center justify-between">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>

              {item.submenu && (
                <Button variant="ghost" size="sm" onClick={() => toggleSection(item.id!)} className="p-1 h-8 w-8">
                  {isExpanded(item.id!) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </Button>
              )}
            </div>

            {item.submenu && isExpanded(item.id!) && (
              <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
                {/* Hardware direct submenu (no nested inventory section) */}
                {item.id === "hardware" && (
                  <div className="space-y-1">
                    {filteredHardwareItems.map((hardwareItem) => (
                      <Link
                        key={hardwareItem.title}
                        href={hardwareItem.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                          isActive(hardwareItem.href)
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("w-2 h-2 rounded-full", hardwareItem.color)} />
                          <hardwareItem.icon className="h-4 w-4" />
                          <span className="font-medium">{hardwareItem.title}</span>
                        </div>

                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-xs px-2 py-0.5 transition-colors",
                            isActive(hardwareItem.href)
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600 group-hover:bg-gray-200",
                          )}
                        >
                          {hardwareItem.count}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}

                {/* IT submenu (existing structure) */}
                {item.id === "it" &&
                  item.submenu.map((subItem) => (
                    <div key={subItem.title}>
                      <div className="flex items-center justify-between">
                        <Link
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1",
                            isActive(subItem.href)
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          {subItem.title}
                        </Link>

                        {subItem.submenu && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSection(subItem.id!)}
                            className="p-1 h-8 w-8"
                          >
                            {isExpanded(subItem.id!) ? (
                              <ChevronDown className="h-3 w-3" />
                            ) : (
                              <ChevronRight className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Inventory Categories - Enhanced Section */}
                      {subItem.submenu && isExpanded(subItem.id!) && (
                        <div className="ml-4 mt-3 space-y-2">
                          {/* Search and Actions */}
                          <div className="space-y-2 mb-3">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                              <Input
                                placeholder="Search inventory..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-8 text-xs"
                              />
                            </div>

                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs flex-1 bg-transparent">
                                <Plus className="h-3 w-3 mr-1" />
                                Add Item
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 bg-transparent">
                                <Filter className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Inventory Categories */}
                          <div className="space-y-1">
                            {filteredInventoryItems.map((invItem) => (
                              <Link
                                key={invItem.title}
                                href={invItem.href}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-200 group",
                                  isActive(invItem.href)
                                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn("w-2 h-2 rounded-full", invItem.color)} />
                                  <invItem.icon className="h-4 w-4" />
                                  <span className="font-medium">{invItem.title}</span>
                                </div>

                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs px-2 py-0.5 transition-colors",
                                    isActive(invItem.href)
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-600 group-hover:bg-gray-200",
                                  )}
                                >
                                  {invItem.count}
                                </Badge>
                              </Link>
                            ))}
                          </div>

                          {/* Quick Stats */}
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs font-medium text-gray-700 mb-2">Quick Stats</div>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Total Items:</span>
                                <span className="font-medium">135</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Low Stock:</span>
                                <span className="font-medium text-orange-600">8</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Maintenance Due:</span>
                                <span className="font-medium text-red-600">3</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  )
}

export { SideNavigation }
export default SideNavigation
