"use client"

import { Package, HardDrive, Wrench, Package2, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/utils/cn"
import { usePathname } from "next/navigation"

const isActive = (pathname, href) => pathname === href

const SideNavigation = () => {
  const pathname = usePathname()
  const navigationItems = [
    {
      title: "Dashboard",
      icon: "DashboardIcon",
      href: "/dashboard",
    },
    {
      title: "IT",
      icon: "ITIcon",
      href: "/it",
      submenu: [
        {
          title: "Inventory",
          href: "/it/inventory",
          icon: Package,
          submenu: [
            { title: "All Items", href: "/it/inventory", icon: Package },
            { title: "Assets", href: "/it/inventory?type=assets", icon: HardDrive },
            { title: "Tools", href: "/it/inventory?type=tools", icon: Wrench },
            { title: "Consumables", href: "/it/inventory?type=consumables", icon: Package2 },
          ],
        },
        // Other IT submenu items can be added here
      ],
    },
    // Other sections can be added here
  ]

  return (
    <nav className="space-y-4">
      {navigationItems.map((item) => {
        const Icon = item.icon
        const active = isActive(pathname, item.href)
        if (item.submenu) {
          return (
            <div key={item.href} className="space-y-1">
              <Link
                href={item.href}
                className={cn(
                  "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full group",
                  active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 mr-3 transition-colors",
                    active ? "text-gray-700" : "text-gray-500 group-hover:text-gray-700",
                  )}
                />
                <span className="flex-1">{item.title}</span>
                <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
              <div className="ml-6 space-y-1 border-l border-gray-200 pl-3">
                {item.submenu.map((subItem) => {
                  const SubIcon = subItem.icon
                  const subActive =
                    isActive(pathname, subItem.href) ||
                    (pathname.includes("/it/inventory") && subItem.href.includes("type="))
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center py-1.5 px-3 text-xs rounded-md transition-all duration-200 w-full group relative",
                        subActive
                          ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-500"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                      )}
                    >
                      <SubIcon
                        className={cn(
                          "h-3 w-3 mr-2 transition-colors",
                          subActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600",
                        )}
                      />
                      <span className="flex-1">{subItem.title}</span>
                      {subActive && <div className="absolute right-2 w-1 h-1 bg-blue-500 rounded-full"></div>}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full group",
              active ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 mr-3 transition-colors",
                active ? "text-gray-700" : "text-gray-500 group-hover:text-gray-700",
              )}
            />
            <span className="flex-1">{item.title}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export default SideNavigation
