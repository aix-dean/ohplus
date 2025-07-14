"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"
import { cn } from "@/lib/utils"

export function CMSBreadcrumb() {
  const pathname = usePathname()

  // Parse the pathname to create breadcrumb items
  const pathSegments = pathname.split("/").filter(Boolean)

  const breadcrumbItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "CMS", href: "/cms/dashboard" },
  ]

  // Add specific breadcrumb items based on the current path
  if (pathSegments.includes("details") && pathSegments.length > 2) {
    const id = pathSegments[pathSegments.length - 1]
    breadcrumbItems.push({
      label: "Details",
      href: "/cms/details",
    })
    breadcrumbItems.push({
      label: `Product ${id}`,
      href: `/cms/details/${id}`,
    })
  } else if (pathSegments.includes("planner")) {
    breadcrumbItems.push({
      label: "Planner",
      href: "/cms/planner",
    })
  } else if (pathSegments.includes("orders")) {
    breadcrumbItems.push({
      label: "Orders",
      href: "/cms/orders",
    })
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1
        const Icon = item.icon

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
            {isLast ? (
              <span className="font-medium text-gray-900 flex items-center">
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "hover:text-gray-900 transition-colors flex items-center",
                  index === 0 && "text-blue-600 hover:text-blue-700",
                )}
              >
                {Icon && <Icon className="h-4 w-4 mr-1" />}
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
