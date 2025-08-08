"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Settings, LogOut, User, Bell, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { useIsAdmin } from "@/hooks/use-is-admin"

export function TopNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  const { user, userData, logout } = useAuth()
  const { unreadCount } = useUnreadMessages()
  const isAdmin = useIsAdmin()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

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

    // Add this new check for business section
    if (pathname.startsWith("/business")) return "Business Developer"

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
  const isAccountPage = pathname === "/account" // New check for account page

  const navBgColor = isSalesSection
    ? "bg-[#ff3333]"
    : isAdminSection
      ? "bg-[#6b46c1]"
      : isCmsSection
        ? "bg-[#f97316]"
        : "bg-[#0a1433]"

  const diagonalBgColor = isSalesSection
    ? "bg-[#ffcccc]"
    : isAdminSection
      ? "bg-[#c4b5fd]"
      : isCmsSection
        ? "bg-[#fed7aa]"
        : "bg-[#38b6ff]"

  const handleMobileNavigation = (href: string) => {
    router.push(href)
    setIsOpen(false)
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error: any) {
      console.error("Logout error:", error)
      // You could add toast notification here if needed
    }
  }

  return (
    <nav className={`top-nav relative ${navBgColor} z-40`}>
      {/* Diagonal section - positioned to always be before the date area */}
      <div
        className={`absolute top-0 right-0 h-full w-[320px] ${diagonalBgColor} transform skew-x-[-20deg] z-0 hidden md:block`}
        style={{ maxWidth: "100vw", overflow: "hidden" }}
      ></div>

      <div className="top-nav-container text-white relative z-10 overflow-hidden">
        <div className="top-nav-content flex items-center justify-between w-full px-4 md:px-8">
          <div className="top-nav-left">
            <div className="top-nav-logo flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-3 p-2 rounded-full text-white hover:text-gray-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold text-white">
                {pageTitle == "Admin - Subscriptions" ? "Admin - Plan Profile" : pageTitle.replace(/\bIt\b/g, "I.T")}
              </h1>
            </div>
            <div className="top-nav-links hidden md:flex"></div>
          </div>

          <div className="top-nav-right flex items-center h-full relative z-20 flex-shrink-0">
            {" "}
            {/* Added relative z-20 and flex-shrink-0 */}
            {/* User controls section (bell and profile) - Conditionally rendered */}
            {!isAccountPage && ( // Only render if NOT on the account page
              <div className="flex items-center mr-2 md:mr-8 relative z-10">
                {" "}
                {/* Added relative z-10 */}
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
                {/* Profile button */}
                <div className="ml-3 relative z-10">
                  <Link href="/account">
                    <button
                      type="button"
                      className="max-w-xs bg-white rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary hover:ring-4 transition-all"
                    >
                      <span className="sr-only">Go to profile</span>
                      <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    </button>
                  </Link>
                </div>
                {/* Logout button */}
                <div className="ml-3 relative z-10">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="bg-white rounded-lg px-3 py-2 flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary hover:bg-gray-50 transition-all"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4 text-gray-700" />
                    <span className="ml-2 text-sm font-medium text-gray-700">Logout</span>
                  </button>
                </div>
              </div>
            )}
            {/* Date display in the light blue section with adjusted padding */}
            <div className="hidden md:flex items-center justify-end h-full pl-8 pr-8 relative z-10">
              {" "}
              {/* Adjusted pl-8 */}
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
                  onClick={handleLogout}
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
