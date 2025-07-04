import type React from "react"
import { ChevronLeft, CreditCard, LayoutDashboard, ListChecks, ShoppingCart, Truck, User } from "lucide-react"
import Link from "next/link"

interface SideNavigationProps {
  section: "admin" | "sales"
}

const SideNavigation: React.FC<SideNavigationProps> = ({ section }) => {
  return (
    <div className="flex flex-col h-full py-4">
      {/* Admin section navigation */}
      {section === "admin" && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-900">Admin</h2>
          <div className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <User className="mr-2 h-4 w-4" />
              Users
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Products
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Orders
            </Link>
            <Link
              href="/admin/deliveries"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <Truck className="mr-2 h-4 w-4" />
              Deliveries
            </Link>
          </div>
        </div>
      )}

      {/* Sales section navigation */}
      {section === "sales" && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-900">Sales</h2>
          <div className="space-y-1">
            <Link
              href="/sales/to-do"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              To Do
            </Link>
          </div>
        </div>
      )}

      {/* Navigation section for sales */}
      {section === "sales" && (
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-900">Navigation</h2>
          <div className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      )}

      {section === "sales" && (
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Link
              href="/sales/to-go"
              className="flex items-center rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <ListChecks className="mr-2 h-4 w-4" />
              To Go
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default SideNavigation
