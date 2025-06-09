"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { usePathname } from "next/navigation"

export function FixedHeader() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const pathname = usePathname()

  // Get page title based on current route
  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[#0a1433] to-[#4bb6ef] border-b border-gray-200 shadow-sm z-50 h-14 flex items-center px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img src="/oh-plus-logo.png" alt="OH Plus Logo" className="h-8 w-auto mr-3" />
          <h1 className="text-lg font-semibold text-white hidden sm:block">OH Plus</h1>
        </div>

        {/* Page Title (center) */}
        <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
          <h1 className="text-xl font-bold text-white">{pageTitle.title}</h1>
          {pageTitle.subtitle && <p className="text-sm text-white text-center">{pageTitle.subtitle}</p>}
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-sm text-white hidden sm:block">
            <span className="font-medium">{format(currentTime, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="text-sm font-mono text-white">
            <span className="font-medium">{format(currentTime, "h:mm a")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Function to map routes to page titles
function getPageTitle(pathname: string): { title: string; subtitle?: string } {
  // Default title
  let title = "Dashboard"
  let subtitle = undefined

  // Map routes to titles
  if (pathname.startsWith("/dashboard")) {
    title = "Dashboard"
  } else if (pathname.startsWith("/sales/dashboard")) {
    title = "OOH Site Inventory"
    subtitle = "Manage your static and LED outdoor advertising sites"
  } else if (pathname.startsWith("/sales/products/")) {
    title = "Product Details"
  } else if (pathname.startsWith("/sales/inventory")) {
    title = "Inventory Management"
  } else if (pathname.startsWith("/sales")) {
    title = "Sales"
  } else if (pathname.startsWith("/operations/dashboard")) {
    title = "Logistics Dashboard"
    subtitle = "Manage your outdoor advertising sites"
  } else if (pathname.startsWith("/operations/assignments")) {
    title = "Assignments"
  } else if (pathname.startsWith("/operations/planner")) {
    title = "Planner"
  } else if (pathname.startsWith("/operations/alerts")) {
    title = "Alerts"
  } else if (pathname.startsWith("/operations")) {
    title = "Operations & Logistics"
  } else if (pathname.startsWith("/finance")) {
    title = "Finance"
  } else if (pathname.startsWith("/accounting")) {
    title = "Accounting"
  } else if (pathname.startsWith("/treasury")) {
    title = "Treasury"
  } else if (pathname.startsWith("/procurement")) {
    title = "Procurement"
  } else if (pathname.startsWith("/hr")) {
    title = "HR"
  } else if (pathname.startsWith("/legal")) {
    title = "Legal"
  } else if (pathname.startsWith("/business-development")) {
    title = "Business Development"
  } else if (pathname.startsWith("/committees")) {
    title = "Committees"
  } else if (pathname.startsWith("/partners")) {
    title = "Partners"
  } else if (pathname.startsWith("/corporate")) {
    title = "Corporate"
  } else if (pathname.startsWith("/admin-control")) {
    title = "Admin Control"
  } else if (pathname.startsWith("/profile")) {
    title = "Profile"
  } else if (pathname.startsWith("/admin")) {
    title = "Admin"
  } else if (pathname.startsWith("/settings")) {
    title = "Settings"
  } else if (pathname.startsWith("/account")) {
    title = "Account"
  } else if (pathname.startsWith("/cms/dashboard")) {
    title = "CMS Dashboard"
    subtitle = "Manage your content and digital displays"
  } else if (pathname.startsWith("/cms/planner")) {
    title = "Content Planner"
    subtitle = "Schedule and manage your content"
  } else if (pathname.startsWith("/cms")) {
    title = "Content Management"
  }

  return { title, subtitle }
}
