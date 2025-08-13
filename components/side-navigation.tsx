import { Package, HardDrive, Wrench, Package2 } from "lucide-react"

const SideNavigation = () => {
  const navigationItems = [
    {
      title: "Dashboard",
      icon: "DashboardIcon",
      href: "/dashboard",
    },
    {
      title: "IT",
      icon: "ITIcon",
      href: "/it",
      submenu: [
        {
          title: "Inventory",
          icon: Package,
          href: "/it/inventory",
          submenu: [
            {
              title: "Assets",
              icon: HardDrive,
              href: "/it/inventory?type=assets",
            },
            {
              title: "Tools",
              icon: Wrench,
              href: "/it/inventory?type=tools",
            },
            {
              title: "Consumables",
              icon: Package2,
              href: "/it/inventory?type=consumables",
            },
          ],
        },
        // Other IT submenu items can be added here
      ],
    },
    // Other sections can be added here
  ]

  return <nav>{/* Navigation rendering logic here */}</nav>
}

export default SideNavigation
