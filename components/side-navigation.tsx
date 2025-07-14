import type React from "react"
import Link from "next/link"
import { BarChart3, Calendar, ClipboardList, Cog, FileText, Monitor } from "lucide-react"

interface NavItem {
  label: string
  href: string
}

const SideNavigation: React.FC = () => {
  const navigationItems: NavItem[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Users", href: "/users" },
    { label: "Products", href: "/products" },
    { label: "CMS Details", href: "/cms/details" },
    { label: "Settings", href: "/settings" },
  ]

  const pathname = "" // Replace with actual pathname if needed

  const isActive = (path: string, href: string) => {
    return path === href
  }

  const CMSItems = [
    { title: "JOs", href: "/cms/orders", icon: ClipboardList },
    { title: "Content Details", href: "/cms/details", icon: FileText },
    { title: "Screen Management", href: "/cms/screens", icon: Monitor },
    { title: "Campaign Scheduler", href: "/cms/scheduler", icon: Calendar },
    { title: "Analytics", href: "/cms/analytics", icon: BarChart3 },
    { title: "Settings", href: "/cms/settings", icon: Cog },
  ]

  const cn = (...classes: string[]) => {
    return classes.filter(Boolean).join(" ")
  }

  return (
    <nav>
      <ul>
        {navigationItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>
              <a>{item.label}</a>
            </Link>
          </li>
        ))}
        {CMSItems.map((item) => {
          const Icon = item.icon
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center py-2 px-3 text-sm rounded-md transition-all duration-200 w-full",
                  active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                <Icon className={cn("h-4 w-4 mr-3", active ? "text-gray-700" : "text-gray-500")} />
                <span className="flex-1">{item.title}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default SideNavigation
