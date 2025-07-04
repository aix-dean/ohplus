"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Settings, LogOut, User, Bell, ChevronRight, Home } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useIsAdmin } from "@/hooks/use-is-admin"

export function TopNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ label: string; href: string }>>([])

  const { user, userData, signOut } = useAuth()
  const { unreadCount } = useUnreadMessages()
  const isAdmin = useIsAdmin()

  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Build breadcrumbs based on the current pathname
  useEffect(() => {
    const updateBreadcrumbs = () => {
      const pathSegments = pathname.split("/").filter(Boolean) // e.g., ["admin", "dashboard"] or ["sales", "products", "new"]
      const crumbs: Array<{ label: string; href: string }> = []

      // Always start with "Dashboard" linking to the root
      crumbs.push({ label: "Dashboard", href: "/" })

      let currentPath = ""
      pathSegments.forEach((segment, index) => {
        currentPath += `/${segment}`

        let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
        let href = currentPath

        // Special handling for main sections (admin, sales, etc.)
        // If it's a main section and the next segment is 'dashboard',
        // or if it's just the section itself (e.g., /admin), link to its dashboard.
        if (["admin", "sales", "logistics", "cms"].includes(segment)) {
          if (index + 1 < pathSegments.length && pathSegments[index + 1] === "dashboard") {
            // If the next segment is 'dashboard', the current segment's label is enough,
            // and its href should point to its dashboard.
            href = `/${segment}/dashboard`
            // We will skip adding the "dashboard" segment itself later.
          } else if (pathSegments.length === 1) {
            // e.g., /admin
            href = `/${segment}/dashboard`
          }
        }

        // Skip adding "dashboard" as a separate crumb if the parent is already a section (e.g., Admin, Sales)
        if (
          segment === "dashboard" &&
          index > 0 &&
          ["admin", "sales", "logistics", "cms"].includes(pathSegments[index - 1])
        ) {
          return // Skip this crumb
        }

        // Handle dynamic segments like [id]
        if (segment.startsWith("[") && segment.endsWith("]")) {
          // For simplicity, use a generic label. In a real app, you might fetch the actual name.
          label = "Details"
        }

        crumbs.push({ label, href })
      })

      // If the current path is just "/", the only crumb should be "Dashboard"
      if (pathname === "/" && crumbs.length > 1) {
        setBreadcrumbs([{ label: "Dashboard", href: "/" }])
      } else {
        setBreadcrumbs(crumbs)
      }
    }

    updateBreadcrumbs()
  }, [pathname])

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) return "Dashboard"

    if (path === "/sales/dashboard") return "Sales - Dashboard"
    if (path === "/logistics/dashboard") return "Logistics - Dashboard"
    if (path === "/cms/dashboard") return "CMS - Dashboard"
    if (path === "/admin/dashboard") return "Admin - Dashboard"
    if (path === "/ai-assistant") return "AI Assistant"
    if (path === "/account") return "Account Settings"
    if (path === "/settings") return "Settings"
    if (path === "/settings/subscription") return "Settings - Subscription"
    if (path === "/help") return "Help & Support"
    if (path === "/features") return "Features"

    if (segments[0]) {
      const section = segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
      let page = ""

      if (segments.length > 1) {
        page = segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
        if (segments.length > 2 && segments[2].match(/\[.*\]/)) {
          page = segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
        } else if (segments.length > 2 && segments[1] === "edit" && segments[2].match(/\[.*\]/)) {
          page = `Edit ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "create") {
          page = `Create ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "new") {
          page = `New ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "view") {
          page = `View ${segments[0].slice(0, -1)}`
        } else if (segments.length > 2 && segments[1] === "cost-estimates") {
          page = `Cost Estimates`
        } else if (segments.length > 2 && segments[1] === "generate-quotation") {
          page = `Generate Quotation`
        } else if (segments.length > 2 && segments[1] === "create-cost-estimate") {
          page = `Create Cost Estimate`
        } else if (segments.length > 2 && segments[1] === "accept") {
          page = `Accept Quotation`
        } else if (segments.length > 2 && segments[1] === "decline") {
          page = `Decline Quotation`
        } else if (segments.length > 2 && segments[1] === "chat") {
          page = `Chat`
        } else if (segments.length > 2 && segments[1] === "bulletin-board") {
          page = `Bulletin Board`
        } else if (segments.length > 2 && segments[1] === "project-campaigns") {
          page = `Project Campaigns`
        } else if (segments.length > 2 && segments[1] === "quotation-requests") {
          page = `Quotation Requests`
        } else if (segments.length > 2 && segments[1] === "bookings") {
          page = `Bookings`
        } else if (segments.length > 2 && segments[1] === "alerts") {
          page = `Alerts`
        } else if (segments.length > 2 && segments[1] === "assignments") {
          page = `Assignments`
        } else if (segments.length > 2 && segments[1] === "planner") {
          page = `Planner`
        } else if (segments.length > 2 && segments[1] === "access-management") {
          page = `Access Management`
        } else if (segments.length > 2 && segments[1] === "chat-analytics") {
          page = `Chat Analytics`
        }

        page = page
          .replace(/-/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      }

      if (page) {
        return `${section} - ${page}`
      }
      return section
    }
    return "Dashboard"
  }

  const pageTitle = getPageTitle(pathname)

  const isSalesSection = pathname.startsWith("/sales")
  const isLogisticsSection = pathname.startsWith("/logistics")
  const isCmsSection = pathname.startsWith("/cms")
  const isAdminSection = pathname.startsWith("/admin")
  const isAccountPage = pathname === "/account"

  const navBgColor = isSalesSection ? "bg-[#ff3333]" : "bg-[#0a1433]"
  const diagonalBgColor = isSalesSection ? "bg-[#ffcccc]" : "bg-[#38b6ff]"

  const handleMobileNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  return (
    <nav className={`top-nav relative ${navBgColor} z-40`}>
      {/* Diagonal section - positioned to always be before the date area */}
      <div
        className={`absolute top-0 right-0 h-full w-[320px] ${diagonalBgColor} transform skew-x-[-20deg] translate-x-[60px] z-0 hidden md:block`}
      ></div>

      <div className="top-nav-container text-white relative z-10">
        <div className="top-nav-content">
          <div className="top-nav-left">
            <div className="top-nav-logo flex items-center">
              <div className="flex items-center space-x-2">
                {breadcrumbs.length > 1 ? (
                  <nav className="flex items-center space-x-2 text-white">
                    {breadcrumbs.map((crumb, index) => (
                      <div key={crumb.href} className="flex items-center">
                        {index === 0 ? (
                          <Home className="h-4 w-4 mr-1" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mx-1 text-white/60" />
                        )}
                        {index === breadcrumbs.length - 1 ? (
                          <span className="text-xl font-semibold">{crumb.label}</span>
                        ) : (
                          <button
                            onClick={() => router.push(crumb.href)}
                            className="text-lg font-medium hover:text-white/80 transition-colors"
                          >
                            {crumb.label}
                          </button>
                        )}
                      </div>
                    ))}
                  </nav>
                ) : (
                  <h1 className="text-xl font-semibold text-white">{pageTitle}</h1>
                )}
              </div>
            </div>
            <div className="top-nav-links hidden md:flex"></div>
          </div>

          <div className="top-nav-right flex items-center h-full relative z-20 flex-shrink-0">
            {!isAccountPage && (
              <div className="flex items-center mr-2 md:mr-8 relative z-10">
                <button
                  className="p-2 rounded-full text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary relative"
                  aria-label="View notifications"
                >
                  <Bell className="h-5 w-5 md:h-6 md:w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {/* Profile dropdown */}
                <div className="ml-3 relative z-10" ref={profileRef}>
                  <button
                    type="button"
                    className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    id="user-menu-button"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                    onClick={() => {
                      setProfileOpen(!profileOpen)
                    }}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  </button>
                  {/* Profile dropdown menu */}
                  {profileOpen && (
                    <div
                      className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="py-1">
                        <Link
                          href="/account"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          Your Profile
                        </Link>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setProfileOpen(false)}
                        >
                          Settings
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setProfileOpen(false)}
                          >
                            Admin
                          </Link>
                        )}
                        <button
                          onClick={signOut}
                          className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Date display in the light blue section with adjusted padding */}
            <div className="hidden md:flex items-center justify-end h-full pl-8 pr-8 relative z-10">
              <span className="text-sm font-medium text-[#0a1433]">{format(currentTime, "MMMM d, yyyy, h:mm a")}</span>
            </div>
            {/* Mobile menu button */}
            <div className="top-nav-mobile md:hidden">
              <button
                type="button"
                className="top-nav-mobile-button text-white"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)}></div>

          {/* Mobile menu */}
          <div className="top-nav-mobile-menu bg-white fixed inset-x-0 top-16 z-50 overflow-y-auto max-h-[calc(100vh-4rem)] shadow-lg">
            <div className="top-nav-mobile-links p-4">
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleMobileNavigation("/settings")}
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${pathname.startsWith("/settings") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  <span className="text-base">Settings</span>
                </button>

                <button
                  onClick={() => handleMobileNavigation("/account")}
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${pathname.startsWith("/account") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span className="text-base">Account</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleMobileNavigation("/admin")}
                    className={`w-full text-left py-3 px-4 rounded-md flex items-center ${pathname.startsWith("/admin") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  >
                    <Settings className="mr-3 h-5 w-5" />
                    <span className="text-base">Admin</span>
                  </button>
                )}

                <button
                  onClick={signOut}
                  className="w-full text-left py-3 px-4 rounded-md flex items-center text-gray-700"
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  <span className="text-base">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  )
}
