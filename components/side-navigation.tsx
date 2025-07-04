import Link from "next/link"
import { BarChart, Bell, ChevronLeft, LayoutDashboard, ListChecks, ShoppingCart, User, Users } from "lucide-react"

export function SideNavigation() {
  return (
    <div className="flex flex-col h-full py-4">
      <div className="space-y-1">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-600">Dashboard</h2>
        <div className="space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <BarChart className="h-4 w-4" />
            Analytics
          </Link>
        </div>
      </div>
      <div className="space-y-1 mt-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-600">Management</h2>
        <div className="space-y-1">
          <Link
            href="/admin/users"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <Users className="h-4 w-4" />
            Users
          </Link>
          <Link
            href="/admin/products"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <ShoppingCart className="h-4 w-4" />
            Products
          </Link>
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <ListChecks className="h-4 w-4" />
            Orders
          </Link>
        </div>
      </div>
      <div className="space-y-1 mt-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-600">Sales</h2>
        <div className="space-y-1">
          <Link
            href="/admin/customers"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <User className="h-4 w-4" />
            Customers
          </Link>
          <Link
            href="/admin/notifications"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
          >
            <Bell className="h-4 w-4" />
            Notifications
          </Link>
        </div>
      </div>
      <div className="mt-auto pt-4 border-t">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight text-gray-600">Navigation</h2>
          <div className="space-y-1">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:text-gray-900 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
