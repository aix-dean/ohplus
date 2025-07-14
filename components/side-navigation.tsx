import Link from "next/link"

const SideNavigation = () => {
  return (
    <nav className="bg-gray-100 h-full w-64 p-4">
      <ul>
        <li className="mb-2">
          <Link href="/" className="block py-2 px-4 hover:bg-gray-200 rounded">
            Dashboard
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/customers" className="block py-2 px-4 hover:bg-gray-200 rounded">
            Customers
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/products" className="block py-2 px-4 hover:bg-gray-200 rounded">
            Products
          </Link>
        </li>

        {/* To Do: Update href for Reports */}
        <li className="mb-2">
          <Link href="/logistics/service-reports" className="block py-2 px-4 hover:bg-gray-200 rounded">
            Reports
          </Link>
        </li>

        <li className="mb-2">
          <Link href="/settings" className="block py-2 px-4 hover:bg-gray-200 rounded">
            Settings
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default SideNavigation
