import Link from "next/link"

const SideNavigation = () => {
  return (
    <nav className="bg-gray-100 p-4">
      <ul>
        <li className="mb-2">
          <Link href="/" className="block hover:bg-gray-200 p-2 rounded">
            Home
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/about" className="block hover:bg-gray-200 p-2 rounded">
            About
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/contact" className="block hover:bg-gray-200 p-2 rounded">
            Contact
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/admin" className="block hover:bg-gray-200 p-2 rounded">
            Admin Dashboard
          </Link>
        </li>
        <li className="mb-2">
          <Link href="/admin/user-management" className="block hover:bg-gray-200 p-2 rounded">
            User Management
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default SideNavigation
