import Link from "next/link"

const SideNavigation = () => {
  return (
    <nav>
      <ul>
        <li>
          <Link href="/">
            <a>Dashboard</a>
          </Link>
        </li>
        <li>
          <Link href="/inventory" data-tour-id="inventory-link">
            <a>Inventory</a>
          </Link>
        </li>
        <li>
          <Link href="/orders">
            <a>Orders</a>
          </Link>
        </li>
        <li>
          <Link href="/customers">
            <a>Customers</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default SideNavigation
