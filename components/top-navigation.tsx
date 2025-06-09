"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  Users,
  FileText,
  Settings,
  LogOut,
  User,
  Bell,
  Truck,
  HelpCircle,
} from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"

export function TopNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [salesOpen, setSalesOpen] = useState(false)
  const [logisticsOpen, setLogisticsOpen] = useState(false)
  const [cmsOpen, setCmsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Create refs for dropdown containers
  const salesRef = useRef<HTMLDivElement>(null)
  const logisticsRef = useRef<HTMLDivElement>(null)
  const cmsRef = useRef<HTMLDivElement>(null)
  const adminRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const helpRef = useRef<HTMLDivElement>(null)

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false)
    setSalesOpen(false)
    setLogisticsOpen(false)
    setCmsOpen(false)
    setAdminOpen(false)
    setProfileOpen(false)
    setHelpOpen(false) // Add this line
  }, [pathname])

  // Handle clicks outside of dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (salesRef.current && !salesRef.current.contains(event.target as Node)) {
        setSalesOpen(false)
      }
      if (logisticsRef.current && !logisticsRef.current.contains(event.target as Node)) {
        setLogisticsOpen(false)
      }
      if (cmsRef.current && !cmsRef.current.contains(event.target as Node)) {
        setCmsOpen(false)
      }
      if (adminRef.current && !adminRef.current.contains(event.target as Node)) {
        setAdminOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false)
      }
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setHelpOpen(false)
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
    setSalesOpen(false)
    setLogisticsOpen(false)
    setCmsOpen(false)
    setAdminOpen(false)
    setHelpOpen(false) // Add this line
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
            <div className="top-nav-links hidden md:flex">
              {/* Help Dropdown */}
              <div className="relative inline-block text-left z-50" ref={helpRef}>
                <button
                  type="button"
                  className={`top-nav-link flex items-center hover:text-white ${isActive("/help") || isActive("/features") || isActive("/ai-assistant") ? "top-nav-link-active font-bold" : ""}`}
                  onClick={() => {
                    setHelpOpen(!helpOpen)
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
                    setProfileOpen(false)
                  }}
                  aria-expanded={helpOpen}
                  aria-haspopup="true"
                >
                  <HelpCircle className="mr-1 h-4 w-4" />
                  Help
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${helpOpen ? "rotate-180" : ""}`} />
                </button>

                {helpOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/features"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setHelpOpen(false)}
                      >
                        Features
                      </Link>
                      <Link
                        href="/help"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setHelpOpen(false)}
                      >
                        Help & Documentation
                      </Link>
                      <Link
                        href="/ai-assistant"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        onClick={() => setHelpOpen(false)}
                      >
                        <Image
                          src="/ohliver-mascot.png"
                          alt="OHLIVER"
                          width={20}
                          height={20}
                          className="mr-2 rounded-full"
                        />
                        Ask OHLIVER
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Sales Dropdown */}
              <div className="relative inline-block text-left z-50" ref={salesRef}>
                <button
                  type="button"
                  className={`top-nav-link flex items-center hover:text-white ${isActive("/sales") ? "top-nav-link-active font-bold" : ""}`}
                  onClick={() => {
                    setSalesOpen(!salesOpen)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
                    setProfileOpen(false)
                  }}
                  aria-expanded={salesOpen}
                  aria-haspopup="true"
                >
                  <ShoppingCart className="mr-1 h-4 w-4" />
                  Sales
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${salesOpen ? "rotate-180" : ""}`} />
                </button>

                {salesOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/sales/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSalesOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/sales/bookings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSalesOpen(false)}
                      >
                        Bookings
                      </Link>
                      <Link
                        href="/sales/clients"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSalesOpen(false)}
                      >
                        Clients
                      </Link>
                      <Link
                        href="/sales/proposals"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSalesOpen(false)}
                      >
                        Proposals
                      </Link>
                      <Link
                        href="/sales/planner"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSalesOpen(false)}
                      >
                        Planner
                      </Link>
                      <Link
                        href="/sales/chat"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setSalesOpen(false)}
                      >
                        Customer Chat
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Logistics Dropdown */}
              <div className="relative inline-block text-left z-50" ref={logisticsRef}>
                <button
                  type="button"
                  className={`top-nav-link flex items-center hover:text-white ${isActive("/logistics") ? "top-nav-link-active font-bold" : ""}`}
                  onClick={() => {
                    setLogisticsOpen(!logisticsOpen)
                    setSalesOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
                    setProfileOpen(false)
                  }}
                  aria-expanded={logisticsOpen}
                  aria-haspopup="true"
                >
                  <Truck className="mr-1 h-4 w-4" />
                  Logistics
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${logisticsOpen ? "rotate-180" : ""}`} />
                </button>

                {logisticsOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/logistics/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setLogisticsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/logistics/assignments"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setLogisticsOpen(false)}
                      >
                        Service Assignments
                      </Link>
                      <Link
                        href="/logistics/planner"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setLogisticsOpen(false)}
                      >
                        Planner
                      </Link>
                      <Link
                        href="/logistics/alerts"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setLogisticsOpen(false)}
                      >
                        Alerts
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* CMS Dropdown */}
              <div className="relative inline-block text-left z-50" ref={cmsRef}>
                <button
                  type="button"
                  className={`top-nav-link flex items-center hover:text-white ${isActive("/cms") ? "top-nav-link-active font-bold" : ""}`}
                  onClick={() => {
                    setCmsOpen(!cmsOpen)
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setAdminOpen(false)
                    setProfileOpen(false)
                  }}
                  aria-expanded={cmsOpen}
                  aria-haspopup="true"
                >
                  <FileText className="mr-1 h-4 w-4" />
                  CMS
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${cmsOpen ? "rotate-180" : ""}`} />
                </button>

                {cmsOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/cms/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setCmsOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/cms/planner"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setCmsOpen(false)}
                      >
                        Planner
                      </Link>
                      <Link
                        href="/cms/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setCmsOpen(false)}
                      >
                        Orders
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Dropdown */}
              <div className="relative inline-block text-left z-50" ref={adminRef}>
                <button
                  type="button"
                  className={`top-nav-link flex items-center hover:text-white ${isActive("/admin") ? "top-nav-link-active font-bold" : ""}`}
                  onClick={() => {
                    setAdminOpen(!adminOpen)
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                    setProfileOpen(false)
                  }}
                  aria-expanded={adminOpen}
                  aria-haspopup="true"
                >
                  <Users className="mr-1 h-4 w-4" />
                  Admin
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${adminOpen ? "rotate-180" : ""}`} />
                </button>

                {adminOpen && (
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/admin/inventory"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminOpen(false)}
                      >
                        Inventory
                      </Link>
                      <Link
                        href="/admin/access-management"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setAdminOpen(false)}
                      >
                        Access Management
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
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
              {/* Mobile Help Section */}
              <div className="mb-4">
                <button
                  type="button"
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/help") || isActive("/features") || isActive("/ai-assistant") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  onClick={() => {
                    setHelpOpen(!helpOpen)
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
                  }}
                >
                  <HelpCircle className="mr-3 h-5 w-5" />
                  <span className="text-base">Help</span>
                  <ChevronDown className={`ml-auto h-5 w-5 transition-transform ${helpOpen ? "rotate-180" : ""}`} />
                </button>

                {helpOpen && (
                  <div className="mt-2 ml-12 space-y-1">
                    <button
                      onClick={() => handleMobileNavigation("/features")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Features
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/help")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Help & Documentation
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/ai-assistant")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900 flex items-center"
                    >
                      <Image
                        src="/ohliver-mascot.png"
                        alt="OHLIVER"
                        width={20}
                        height={20}
                        className="mr-2 rounded-full"
                      />
                      Ask OHLIVER
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Sales Section */}
              <div className="mb-4">
                <button
                  type="button"
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/sales") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  onClick={() => {
                    setSalesOpen(!salesOpen)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
                  }}
                >
                  <ShoppingCart className="mr-3 h-5 w-5" />
                  <span className="text-base">Sales</span>
                  <ChevronDown className={`ml-auto h-5 w-5 transition-transform ${salesOpen ? "rotate-180" : ""}`} />
                </button>

                {salesOpen && (
                  <div className="mt-2 ml-12 space-y-1">
                    <button
                      onClick={() => handleMobileNavigation("/sales/dashboard")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/sales/bookings")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Bookings
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/sales/clients")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Clients
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/sales/proposals")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Proposals
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/sales/planner")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Planner
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/sales/chat")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Customer Chat
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Logistics Section */}
              <div className="mb-4">
                <button
                  type="button"
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/logistics") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  onClick={() => {
                    setLogisticsOpen(!logisticsOpen)
                    setSalesOpen(false)
                    setCmsOpen(false)
                    setAdminOpen(false)
                  }}
                >
                  <Truck className="mr-3 h-5 w-5" />
                  <span className="text-base">Logistics</span>
                  <ChevronDown
                    className={`ml-auto h-5 w-5 transition-transform ${logisticsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {logisticsOpen && (
                  <div className="mt-2 ml-12 space-y-1">
                    <button
                      onClick={() => handleMobileNavigation("/logistics/dashboard")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/logistics/assignments")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Service Assignments
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/logistics/planner")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Planner
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/logistics/alerts")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Alerts
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile CMS Section */}
              <div className="mb-4">
                <button
                  type="button"
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/cms") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  onClick={() => {
                    setCmsOpen(!cmsOpen)
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setAdminOpen(false)
                  }}
                >
                  <FileText className="mr-3 h-5 w-5" />
                  <span className="text-base">CMS</span>
                  <ChevronDown className={`ml-auto h-5 w-5 transition-transform ${cmsOpen ? "rotate-180" : ""}`} />
                </button>

                {cmsOpen && (
                  <div className="mt-2 ml-12 space-y-1">
                    <button
                      onClick={() => handleMobileNavigation("/cms/dashboard")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/cms/planner")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Planner
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/cms/orders")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Orders
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Admin Section */}
              <div className="mb-4">
                <button
                  type="button"
                  className={`w-full text-left py-3 px-4 rounded-md flex items-center ${isActive("/admin") ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700"}`}
                  onClick={() => {
                    setAdminOpen(!adminOpen)
                    setSalesOpen(false)
                    setLogisticsOpen(false)
                    setCmsOpen(false)
                  }}
                >
                  <Users className="mr-3 h-5 w-5" />
                  <span className="text-base">Admin</span>
                  <ChevronDown className={`ml-auto h-5 w-5 transition-transform ${adminOpen ? "rotate-180" : ""}`} />
                </button>

                {adminOpen && (
                  <div className="mt-2 ml-12 space-y-1">
                    <button
                      onClick={() => handleMobileNavigation("/admin")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/admin/inventory")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Inventory
                    </button>
                    <button
                      onClick={() => handleMobileNavigation("/admin/access-management")}
                      className="block w-full text-left py-2 text-base text-gray-600 hover:text-gray-900"
                    >
                      Access Management
                    </button>
                  </div>
                )}
              </div>

              {/* Direct links */}
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
