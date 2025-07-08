"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  MessageSquare,
  Calendar,
  FileText,
  Package,
  Users,
  CreditCard,
  MapPin,
  AlertTriangle,
  UserCheck,
  CalendarIcon,
  BarChart3,
  ClipboardList,
  Target,
  Briefcase,
  ShoppingCart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  isActive?: boolean
}

interface NavigationSection {
  title: string
  items: NavigationItem[]
}

export function SideNavigation() {
  const pathname = usePathname()
  const [currentSlide, setCurrentSlide] = useState(0)

  // Show admin navigation for admin routes and logistics calendar
  const isAdminNavigation = pathname?.startsWith("/admin") || pathname === "/logistics/calendar"

  const adminSections: NavigationSection[] = [
    {
      title: "To Go",
      items: [
        {
          name: "Dashboard",
          href: "/admin/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/admin/dashboard",
        },
        {
          name: "Bulletin Board",
          href: "/admin/bulletin-board",
          icon: MessageSquare,
          isActive: pathname === "/admin/bulletin-board",
        },
        {
          name: "Calendar",
          href: "/logistics/calendar",
          icon: Calendar,
          isActive: pathname === "/logistics/calendar",
        },
      ],
    },
    {
      title: "To Do",
      items: [
        {
          name: "Documents",
          href: "/admin/documents",
          icon: FileText,
          isActive: pathname === "/admin/documents",
        },
        {
          name: "Inventory",
          href: "/admin/inventory",
          icon: Package,
          isActive: pathname?.startsWith("/admin/inventory"),
        },
        {
          name: "User Management",
          href: "/admin/access-management",
          icon: Users,
          isActive: pathname === "/admin/access-management",
        },
        {
          name: "Subscription",
          href: "/admin/subscriptions",
          icon: CreditCard,
          isActive: pathname?.startsWith("/admin/subscriptions"),
        },
      ],
    },
  ]

  const logisticsSections: NavigationSection[] = [
    {
      title: "Overview",
      items: [
        {
          name: "Dashboard",
          href: "/logistics/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/logistics/dashboard",
        },
        {
          name: "Sites",
          href: "/logistics/sites",
          icon: MapPin,
          isActive: pathname?.startsWith("/logistics/sites"),
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          name: "Assignments",
          href: "/logistics/assignments",
          icon: UserCheck,
          isActive: pathname === "/logistics/assignments",
        },
        {
          name: "Alerts",
          href: "/logistics/alerts",
          icon: AlertTriangle,
          isActive: pathname === "/logistics/alerts",
        },
        {
          name: "Planner",
          href: "/logistics/planner",
          icon: CalendarIcon,
          isActive: pathname === "/logistics/planner",
        },
      ],
    },
  ]

  const salesSections: NavigationSection[] = [
    {
      title: "Sales",
      items: [
        {
          name: "Dashboard",
          href: "/sales/dashboard",
          icon: BarChart3,
          isActive: pathname === "/sales/dashboard",
        },
        {
          name: "Clients",
          href: "/sales/clients",
          icon: Users,
          isActive: pathname === "/sales/clients",
        },
        {
          name: "Products",
          href: "/sales/products",
          icon: Package,
          isActive: pathname?.startsWith("/sales/products"),
        },
        {
          name: "Proposals",
          href: "/sales/proposals",
          icon: FileText,
          isActive: pathname?.startsWith("/sales/proposals"),
        },
        {
          name: "Job Orders",
          href: "/sales/job-orders",
          icon: ClipboardList,
          isActive: pathname?.startsWith("/sales/job-orders"),
        },
        {
          name: "Bookings",
          href: "/sales/bookings",
          icon: Calendar,
          isActive: pathname?.startsWith("/sales/bookings"),
        },
        {
          name: "Chat",
          href: "/sales/chat",
          icon: MessageSquare,
          badge: "3",
          isActive: pathname?.startsWith("/sales/chat"),
        },
        {
          name: "Planner",
          href: "/sales/planner",
          icon: Target,
          isActive: pathname === "/sales/planner",
        },
        {
          name: "Campaigns",
          href: "/sales/project-campaigns",
          icon: Briefcase,
          isActive: pathname?.startsWith("/sales/project-campaigns"),
        },
        {
          name: "Bulletin Board",
          href: "/sales/bulletin-board",
          icon: MessageSquare,
          isActive: pathname === "/sales/bulletin-board",
        },
      ],
    },
  ]

  const cmsSections: NavigationSection[] = [
    {
      title: "Content",
      items: [
        {
          name: "Dashboard",
          href: "/cms/dashboard",
          icon: LayoutDashboard,
          isActive: pathname === "/cms/dashboard",
        },
        {
          name: "Orders",
          href: "/cms/orders",
          icon: ShoppingCart,
          isActive: pathname === "/cms/orders",
        },
        {
          name: "Planner",
          href: "/cms/planner",
          icon: Calendar,
          isActive: pathname === "/cms/planner",
        },
      ],
    },
  ]

  const getCurrentSections = () => {
    if (isAdminNavigation) return adminSections
    if (pathname?.startsWith("/logistics")) return logisticsSections
    if (pathname?.startsWith("/sales")) return salesSections
    if (pathname?.startsWith("/cms")) return cmsSections
    return adminSections
  }

  const sections = getCurrentSections()

  const intelligenceSlides = [
    {
      title: "Analytics Insights",
      description: "View performance metrics and trends",
      color: "bg-purple-500",
    },
    {
      title: "AI Recommendations",
      description: "Get smart suggestions for optimization",
      color: "bg-blue-500",
    },
    {
      title: "Predictive Analytics",
      description: "Forecast future trends and patterns",
      color: "bg-green-500",
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % intelligenceSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [intelligenceSlides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % intelligenceSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + intelligenceSlides.length) % intelligenceSlides.length)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Notification Section */}
      <div className="p-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">Notification</h3>
              <Button variant="link" size="sm" className="text-blue-600 p-0 h-auto">
                See All
              </Button>
            </div>
            <p className="text-sm text-blue-700">No notification for now.</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 px-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-sm font-medium text-gray-500 mb-3">{section.title}</h3>
            <nav className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={item.isActive ? "secondary" : "ghost"}
                      className={`w-full justify-start ${
                        item.isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.name}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto bg-red-100 text-red-800">
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        ))}
      </div>

      <Separator className="mx-4" />

      {/* Intelligence Section */}
      <div className="p-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                <h3 className="font-semibold">Intelligence</h3>
              </div>
              <Button variant="link" size="sm" className="text-white p-0 h-auto">
                See All
              </Button>
            </div>

            <div className="relative h-20 mb-3">
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`w-full h-16 rounded-lg ${intelligenceSlides[currentSlide].color} bg-opacity-30 flex items-center justify-center`}
                >
                  <div className="text-center">
                    <div className="text-xs font-medium mb-1">{intelligenceSlides[currentSlide].title}</div>
                    <div className="text-xs opacity-80">{intelligenceSlides[currentSlide].description}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevSlide} className="text-white hover:bg-white/20 p-1 h-auto">
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex space-x-1">
                {intelligenceSlides.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>

              <Button variant="ghost" size="sm" onClick={nextSlide} className="text-white hover:bg-white/20 p-1 h-auto">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
