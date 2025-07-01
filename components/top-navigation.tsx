"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { MenuIcon } from "lucide-react"
import { SideNavigation } from "./side-navigation" // Assuming SideNavigation is imported here

export function TopNavigation() {
  const pathname = usePathname()

  let title = ""
  if (pathname.startsWith("/admin")) {
    title = "Admin"
  } else if (pathname.startsWith("/sales/dashboard")) {
    title = "Sales-Dashboard"
  }
  // Add more conditions for other specific titles if needed, or a default

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden bg-transparent">
            <MenuIcon className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SideNavigation />
        </SheetContent>
      </Sheet>
      <h1 className="text-xl font-semibold md:text-2xl">{title}</h1>
      {/* Other header content like search, user menu, etc. */}
    </header>
  )
}
