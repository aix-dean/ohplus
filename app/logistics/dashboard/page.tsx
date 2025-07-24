"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, List, Grid3X3, X } from "lucide-react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import AllSitesTab from "./all-sites"
import { useAuth } from "@/contexts/auth-context"
import { RouteProtection } from "@/components/route-protection"

export default function LogisticsDashboardPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterValue, setFilterValue] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const { user, userData } = useAuth()

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <RouteProtection requiredRoles="logistics">
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <main className="p-6">
          <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {userData?.first_name
                  ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Dashboard`
                  : "Dashboard"}
              </h1>
              <Button
                onClick={() => setDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
              >
                Service Assignment
              </Button>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search sites..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter and View Controls */}
              <div className="flex items-center gap-3">
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content - All Sites with updated styling */}
            <div className="bg-white rounded-lg shadow-sm">
              <AllSitesTab searchQuery={searchQuery} filterValue={filterValue} viewMode={viewMode} />
            </div>
          </div>
        </main>

        {/* Service Assignment Dialog */}
        <ServiceAssignmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={() => {
            // You could add a success toast notification here
          }}
        />
      </div>
    </RouteProtection>
  )
}
