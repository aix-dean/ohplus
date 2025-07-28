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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [filterBy, setFilterBy] = useState("All")
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              >
                Service Assignment
              </Button>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Search and Filter */}
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search sites..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 bg-white border-gray-200"
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

                {/* Status Filter */}
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32 bg-white border-gray-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="Occupied">Occupied</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* All Sites Display */}
            <div className="bg-white rounded-lg border border-gray-200">
              <AllSitesTab searchQuery={searchQuery} filterBy={filterBy} viewMode={viewMode} />
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
