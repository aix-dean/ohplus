"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { BellIcon, SearchIcon, UserIcon, ArrowLeftIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface FixedHeaderProps {
  title?: string
  showBackButton?: boolean
}

export function FixedHeader({ title, showBackButton = false }: FixedHeaderProps) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const isAdminPage = pathname.startsWith("/admin")
  const isSalesPage = pathname.startsWith("/sales")
  const isLogisticsPage = pathname.startsWith("/logistics")

  let headerBgClass = "bg-salesHeaderRose" // Default for sales and other pages
  let buttonHoverClass = "hover:bg-salesHeaderRose/80"

  if (isAdminPage) {
    headerBgClass = "bg-adminHeaderDark"
    buttonHoverClass = "hover:bg-adminHeaderDark/80"
  } else if (isLogisticsPage) {
    headerBgClass = "bg-logisticsHeader" // Assuming logisticsHeader is defined in tailwind.config.ts
    buttonHoverClass = "hover:bg-logisticsHeader/80"
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between px-4 shadow-md transition-colors duration-300",
        headerBgClass,
      )}
    >
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
            <ArrowLeftIcon className="h-6 w-6" />
            <span className="sr-only">Back</span>
          </Button>
        )}
        <h1 className="text-xl font-semibold text-white">{title || "Dashboard"}</h1>
      </div>
      <div className="relative flex-1 max-w-md mx-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearSearch}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:bg-gray-200"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className={cn("text-white", buttonHoverClass)}>
          <BellIcon className="h-6 w-6" />
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("text-white", buttonHoverClass)}>
              <UserIcon className="h-6 w-6" />
              <span className="sr-only">User menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-white text-sm hidden md:block">
          {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })},{" "}
          {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </header>
  )
}
