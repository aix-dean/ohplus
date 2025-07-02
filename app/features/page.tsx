"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  BarChart3,
  Truck,
  FileText,
  ShieldCheck,
  Settings,
  Star,
  Clock,
  CheckCircle,
  MessageCircle,
  Users,
  Package2,
  Lightbulb,
  DollarSign,
  MapPin,
  Calendar,
} from "lucide-react"

const features = [
  {
    section: "Sales",
    description: "Customer relationship and revenue management",
    icon: BarChart3,
    color: "bg-green-500",
    pages: [
      {
        title: "Sales Dashboard",
        href: "/sales/dashboard",
        description: "Sales performance metrics and analytics",
        status: "active",
      },
      {
        title: "Bookings",
        href: "/sales/bookings",
        description: "Manage customer bookings and reservations",
        status: "active",
      },
      {
        title: "Clients",
        href: "/sales/clients",
        description: "Customer database and relationship management",
        status: "active",
      },
      {
        title: "Products",
        href: "/sales/products",
        description: "Product catalog and inventory management",
        status: "active",
      },
      {
        title: "Proposals",
        href: "/sales/proposals",
        description: "Create and manage detailed business proposals",
        status: "active",
      },
      {
        title: "Quotations",
        href: "/sales/quotation-requests",
        description: "Generate professional quotations with PDF export",
        status: "active",
      },
      {
        title: "Quotation Email System",
        href: "/sales/quotation-requests",
        description: "Send professional quotations via email with accept/decline options",
        status: "active",
      },
      {
        title: "Sales Chat",
        href: "/sales/chat",
        description: "Internal team communication and collaboration",
        status: "active",
      },
      {
        title: "Sales Planner",
        href: "/sales/planner",
        description: "Schedule and plan sales activities with weather integration",
        status: "active",
      },
      {
        title: "Project Campaigns",
        href: "/sales/project-campaigns",
        description: "Manage customer bookings and reservations",
        status: "active",
      },
    ],
  },
  {
    section: "Logistics",
    description: "Operations and resource management",
    icon: Truck,
    color: "bg-orange-500",
    pages: [
      {
        title: "Logistics Dashboard",
        href: "/logistics/dashboard",
        description: "Operational metrics and comprehensive site monitoring",
        status: "active",
      },
      {
        title: "Service Assignments",
        href: "/logistics/assignments",
        description: "Assign and track service tasks with weather considerations",
        status: "active",
      },
      {
        title: "Site Management",
        href: "/logistics/sites",
        description: "Monitor LED and static billboard sites",
        status: "active",
      },
      {
        title: "Logistics Planner",
        href: "/logistics/planner",
        description: "Schedule logistics operations and maintenance",
        status: "active",
      },
      {
        title: "Alerts & Monitoring",
        href: "/logistics/alerts",
        description: "System alerts and real-time notifications",
        status: "active",
      },
      {
        title: "Products & Inventory",
        href: "/logistics/products",
        description: "Track logistics inventory and equipment",
        status: "active",
      },
    ],
  },
  {
    section: "CMS",
    description: "Content management and publishing",
    icon: FileText,
    color: "bg-purple-500",
    pages: [
      {
        title: "CMS Dashboard",
        href: "/cms/dashboard",
        description: "Content overview and publishing metrics",
        status: "active",
      },
      {
        title: "Content Planner",
        href: "/cms/planner",
        description: "Schedule and plan content publishing with weather data",
        status: "active",
      },
      {
        title: "Content Orders",
        href: "/cms/orders",
        description: "Manage content creation and approval workflows",
        status: "active",
      },
      {
        title: "Site Details",
        href: "/cms/details",
        description: "Detailed content management for specific sites",
        status: "active",
      },
    ],
  },
  {
    section: "Admin",
    description: "System administration and management",
    icon: ShieldCheck,
    color: "bg-red-500",
    pages: [
      {
        title: "Admin Dashboard",
        href: "/admin",
        description: "System overview and administrative controls",
        status: "active",
      },
      {
        title: "Inventory Management",
        href: "/admin/inventory",
        description: "Manage system inventory and assets",
        status: "active",
      },
      {
        title: "Product Management",
        href: "/admin/products",
        description: "Create and manage product catalog",
        status: "active",
      },
      {
        title: "Access Management",
        href: "/admin/access-management",
        description: "User roles, permissions, and security settings",
        status: "active",
      },
      {
        title: "Chat Analytics",
        href: "/admin/chat-analytics",
        description: "Monitor and analyze chat system usage",
        status: "active",
      },
    ],
  },
  {
    section: "Settings",
    description: "System configuration and preferences",
    icon: Settings,
    color: "bg-gray-500",
    pages: [
      {
        title: "General Settings",
        href: "/settings",
        description: "Account settings and preferences",
        status: "active",
      },
      {
        title: "Account Management",
        href: "/account",
        description: "Personal account information and security",
        status: "active",
      },
      {
        title: "Subscription",
        href: "/settings/subscription",
        description: "Manage subscription plans and billing",
        status: "active",
      },
    ],
  },
  {
    section: "OHLIVER Assistant",
    description: "AI-powered help and guidance",
    icon: MessageCircle,
    color: "bg-blue-500",
    pages: [
      {
        title: "Chat with OHLIVER",
        href: "/ai-assistant",
        description: "Full-screen chat interface with your AI assistant",
        status: "active",
      },
    ],
  },
  {
    section: "Public Access",
    description: "Client-facing features and external access",
    icon: Users,
    color: "bg-indigo-500",
    pages: [
      {
        title: "Proposal Viewer",
        href: "/proposals/view",
        description: "Public proposal viewing with password protection",
        status: "active",
      },
      {
        title: "Quotation Response",
        href: "/quotations",
        description: "Client quotation accept/decline interface",
        status: "active",
      },
    ],
  },
  {
    section: "Authentication",
    description: "User authentication and security",
    icon: ShieldCheck,
    color: "bg-teal-500",
    pages: [
      {
        title: "Login",
        href: "/login",
        description: "Secure user authentication",
        status: "active",
      },
      {
        title: "Registration",
        href: "/register",
        description: "New user account creation",
        status: "active",
      },
      {
        title: "Password Recovery",
        href: "/forgot-password",
        description: "Password reset functionality",
        status: "active",
      },
    ],
  },
  {
    section: "Client Management",
    description:
      "Efficiently manage client information, communication history, and project details in one centralized system.",
    icon: Users,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Proposal Generation",
    description:
      "Create professional and customized proposals quickly with integrated templates and automated calculations.",
    icon: Lightbulb,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Cost Estimation",
    description: "Generate accurate cost estimates for projects, including materials, labor, and other expenses.",
    icon: DollarSign,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Quotation Management",
    description:
      "Streamline the quotation process from creation to approval, with automated notifications and tracking.",
    icon: CheckCircle,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Inventory Tracking",
    description:
      "Keep real-time track of your inventory, including product availability, location, and maintenance schedules.",
    icon: Package2,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Site Management",
    description: "Manage all your outdoor advertising sites, including location, type, status, and performance data.",
    icon: MapPin,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Content Scheduling",
    description: "Plan and schedule content for various advertising channels with an intuitive calendar view.",
    icon: Calendar,
    color: "bg-gray-500",
    pages: [],
  },
  {
    section: "Analytics & Reporting",
    description: "Gain insights into your business performance with comprehensive dashboards and customizable reports.",
    icon: BarChart3,
    color: "bg-gray-500",
    pages: [],
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      )
    case "development":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          In Development
        </Badge>
      )
    case "beta":
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          <Star className="w-3 h-3 mr-1" />
          Beta
        </Badge>
      )
    default:
      return null
  }
}

export default function FeaturesPage() {
  const totalPages = features.reduce((acc, section) => acc + section.pages.length, 0)
  const activePages = features.reduce(
    (acc, section) => acc + section.pages.filter((page) => page.status === "active").length,
    0,
  )
  const totalModules = features.length

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-60px)] py-12 px-4 md:px-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-50 mb-4">
          Powerful Features for Your OOH Business
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Jiven offers a comprehensive suite of tools designed to streamline your outdoor advertising operations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {features.map((section) => {
          const SectionIcon = section.icon

          return (
            <Card
              key={section.section}
              className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg"
            >
              <div className="mb-4 p-3 rounded-full bg-primary/10 dark:bg-primary/20">{SectionIcon}</div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                  {section.section}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">{section.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-50 mb-4">
          Ready to Transform Your Operations?
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Join Jiven today and experience the future of outdoor advertising management.
        </p>
        <Button size="lg" asChild>
          <Link href="/register">Get Started Free</Link>
        </Button>
      </div>
    </div>
  )
}
