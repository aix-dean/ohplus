"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { BarChart3, FileText, HelpCircle, Home, Menu, Truck, Zap, Shield } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    current: false,
  },
  {
    name: "Sales",
    icon: BarChart3,
    children: [
      { name: "Dashboard", href: "/sales/dashboard" },
      { name: "Clients", href: "/sales/clients" },
      { name: "Products", href: "/sales/products" },
      { name: "Proposals", href: "/sales/proposals" },
      { name: "Quotations", href: "/sales/quotations" },
      { name: "Job Orders", href: "/sales/job-orders" },
      { name: "Project Campaigns", href: "/sales/project-campaigns" },
      { name: "Bookings", href: "/sales/bookings" },
      { name: "Chat", href: "/sales/chat" },
      { name: "Planner", href: "/sales/planner" },
      { name: "Bulletin Board", href: "/sales/bulletin-board" },
    ],
  },
  {
    name: "Logistics",
    icon: Truck,
    children: [
      { name: "Dashboard", href: "/logistics/dashboard" },
      { name: "Sites", href: "/logistics/sites" },
      { name: "Assignments", href: "/logistics/assignments" },
      { name: "Alerts", href: "/logistics/alerts" },
      { name: "Planner", href: "/logistics/planner" },
    ],
  },
  {
    name: "CMS",
    icon: FileText,
    children: [
      { name: "Dashboard", href: "/cms/dashboard" },
      { name: "Orders", href: "/cms/orders" },
      { name: "Planner", href: "/cms/planner" },
    ],
  },
  {
    name: "Admin",
    icon: Shield,
    children: [
      { name: "Dashboard", href: "/admin/dashboard" },
      { name: "User Management", href: "/admin/user-management" },
      { name: "Registration Codes", href: "/admin/registration-codes" },
      { name: "Documents", href: "/admin/documents" },
      { name: "Inventory", href: "/admin/inventory" },
      { name: "Products", href: "/admin/products" },
      { name: "Chat Analytics", href: "/admin/chat-analytics" },
      { name: "Subscriptions", href: "/admin/subscriptions" },
    ],
  },
  {
    name: "AI Assistant",
    href: "/ai-assistant",
    icon: Zap,
    current: false,
  },
  {
    name: "Help",
    href: "/help",
    icon: HelpCircle,
    current: false,
  },
]

function NavigationContent() {
  const pathname = usePathname()
  const [openItems, setOpenItems] = useState<string[]>([])
  const { userData } = useAuth()

  const toggleItem = (name: string) => {
    setOpenItems((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  const hasActiveChild = (children: { href: string }[]) => {
    return children.some((child) => isActive(child.href))
  }

  return (
    <ScrollArea className="flex-1 px-3">
      <div className="space-y-1 py-2">
        {navigation.map((item) => {
          if (item.children) {
            const isOpen = openItems.includes(item.name) || hasActiveChild(item.children)
            return (
              <div key={item.name}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    hasActiveChild(item.children) && "bg-accent text-accent-foreground",
                  )}
                  onClick={() => toggleItem(item.name)}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
                {isOpen && (
                  <div className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <Button
                        key={child.href}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start",
                          isActive(child.href) && "bg-accent text-accent-foreground",
                        )}
                        asChild
                      >
                        <Link href={child.href}>{child.name}</Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Button
              key={item.name}
              variant="ghost"
              className={cn("w-full justify-start", isActive(item.href!) && "bg-accent text-accent-foreground")}
              asChild
            >
              <Link href={item.href!}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.name}
              </Link>
            </Button>
          )
        })}
      </div>
    </ScrollArea>
  )
}

export function SideNavigation() {
  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-background border-r overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold">OH Plus</h1>
          </div>
          <NavigationContent />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center flex-shrink-0 px-4 py-5">
              <h1 className="text-xl font-bold">OH Plus</h1>
            </div>
            <NavigationContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
