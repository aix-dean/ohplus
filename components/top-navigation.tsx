import type React from "react"
import Link from "next/link"

interface NavItem {
  label: string
  href: string
}

interface TopNavigationProps {
  navItems?: NavItem[]
}

const TopNavigation: React.FC<TopNavigationProps> = ({ navItems }) => {
  // Default navigation items if none are provided
  const defaultNavItems: NavItem[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    { label: "CMS Details 1", href: "/cms/details/1" }, // Updated route
    { label: "CMS Details 2", href: "/cms/details/2" }, // Updated route
  ]

  const navigationItems = navItems || defaultNavItems

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

export default TopNavigation
