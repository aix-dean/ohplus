"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X, Settings, LogOut, User, Bell } from "lucide-react" // Removed ShoppingCart, Truck, FileText, Users, HelpCircle
import Image from "next/image"
import { format } from "date-fns"

export function TopNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false) // Keep profile dropdown state
  const pathname = usePathname()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Create ref for profile dropdown container
  const profileRef = useRef<HTMLDivElement>(null)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setProfileOpen(false) // Only reset profile dropdown
  }, [pathname])

  // Handle clicks outside of profile dropdown
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
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Prevent body scroll when mobile menu is open
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

  // Update the isActive function to check for the new logistics path
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/")
  }

  // Determine the current section based on the pathname
  const isSalesSection = isActive("/sales")
  // The following are kept for background color logic, even if links are removed
  const isLogisticsSection = isActive("/logistics")
  const isCmsSection = isActive("/cms")
  const isAdminSection = isActive("/admin")

  // Set background colors based on the current section
  const navBgColor = isSalesSection
    ? "bg-[#ff3333]" // Red for Sales
    : "bg-[#0a1433]" // Default dark blue

  const diagonalBgColor = isSalesSection
    ? "bg-[#ffcccc]" // Light red for Sales diagonal
    : "bg-[#38b6ff]" // Default light blue

  // Handle mobile navigation
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
            <div className="top-nav-logo">
              <Link href="/">
                <Image src="/oh-plus-logo.png" alt="OH+ Logo" width={40} height={40} className="h-8 w-auto" />
              </Link>
              <span className="ml-2 text-xl font-semibold text-white">OH+</span>
            </div>
            {/* Removed Help, Sales, Logistics, CMS, Admin links from desktop nav */}
            <div className="top-nav-links hidden md:flex">{/* No navigation links here anymore */}</div>
          </div>

          <div className="top-nav-right flex items-center h-full">
            {/* User controls section (bell and profile) */}
            <div className="flex items-center mr-2 md:mr-8">
              <button
                className="p-2 rounded-full text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                aria-label="View notifications"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative z-50" ref={profileRef}>
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
                      <Link
                        href="/login"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        Sign out
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date display in the light blue section with added padding */}
            <div className="hidden md:flex items-center justify-end h-full pl-12 pr-8 relative z-10">
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
              {/* Removed all mobile sections for Help, Sales, Logistics, CMS, Admin */}

              {/* Direct links (Profile related) */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => handleMobileNavigation("/settings")}
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/settings") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                >
                  <Settings className="mr-3 h-5 w-5" />
                  <span className="text-base">Settings</span>
                </button>

                <button
                  onClick={() => handleMobileNavigation("/account")}
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/account") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                >
                  <User className="mr-3 h-5 w-5" />
                  <span className="text-base">Account</span>
                </button>

                <button
                  onClick={() => handleMobileNavigation("/login")}
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
