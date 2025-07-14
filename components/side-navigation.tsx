import type React from "react"
import Link from "next/link"

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
      </ul>
    </nav>
  )
}

export default SideNavigation
