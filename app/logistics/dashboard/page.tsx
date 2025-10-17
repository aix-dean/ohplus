"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, List, Grid3X3, X, Loader2, LayoutGrid, Menu } from "lucide-react"
import AllSitesTab from "./all-sites"
import { useAuth } from "@/contexts/auth-context"
import { RouteProtection } from "@/components/route-protection"

export default function LogisticsDashboardPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [contentTypeFilter, setContentTypeFilter] = useState("Static")
  const [activeTab, setActiveTab] = useState<'Static' | 'Digital'>('Static')
  const { user, userData } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <RouteProtection requiredRoles="logistics">
      <div className="flex-1 overflow-auto relative bg-gray-50">
        <main className="p-6">
          <div className="flex flex-col gap-2">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {userData?.first_name
                  ? `${userData.first_name.charAt(0).toUpperCase()}${userData.first_name.slice(1).toLowerCase()}'s Dashboard`
                  : "Dashboard"}
              </h1>
              <div className="space-x-2">
                <span className="mr-4 text-gray-700 font-medium text-xs">
                  Create:
                </span>
                <button
                onClick={() => {
                  setIsLoading(true)
                  router.push("/logistics/assignments/create")
                  setTimeout(() => setIsLoading(false), 1000)
                }}
                disabled={isLoading}
                className="w-[140px] rounded-[6.02px] text-xs font-medium bg-white border-silver border-solid border-[1.2px] box-border h-6"
              >
                {isLoading ? (
                  <>
                    Service Assiment..
                  </>
                ) : (
                  "Service Assignment"
                )}
              </button>
                 <button
                onClick={() => {
                  setIsLoading(true)
                  router.push("/logistics/reports/select-service-assignment")
                  setTimeout(() => setIsLoading(false), 1000)
                }}
                disabled={isLoading}
                className="w-[90px] rounded-[6.02px] text-xs font-medium bg-white border-silver border-solid border-[1.2px] box-border h-6"
              >
                {isLoading ? (
                  <>
                    Reports..
                  </>
                ) : (
                  "Reports"
                )}
              </button>
              </div>
            </div>

            {/* Controls Section */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {/* Search and Filter */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center flex-1 max-w-md space-x-2">
                    <span className="text-xs font-medium">Search: </span>
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10 bg-white border-gray-200 w-[190px]] h-[25px]"
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

                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0 "
                  >
                    <Menu className="h-4 w-4 text-gray-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <LayoutGrid className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </div>

              {/* Tab Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setActiveTab('Static'); setContentTypeFilter('Static'); }}
                  className={`px-6 rounded-lg ${activeTab === 'Static' ? 'bg-green-500 text-white' : 'border-2 border-gray-200 text-black'}`}
                >
                  Static
                </button>
                <button
                  onClick={() => { setActiveTab('Digital'); setContentTypeFilter('Dynamic'); }}
                  className={`px-6 rounded-lg ${activeTab === 'Digital' ? 'bg-green-500 text-white' : 'border-2 border-gray-200 text-black'}`}
                >
                  Digital
                </button>
              </div>
            </div>

            {/* All Sites Display */}
              <AllSitesTab searchQuery={searchQuery} contentTypeFilter={contentTypeFilter} viewMode={viewMode} />
            
          </div>
        </main>

      </div>
    </RouteProtection>
  )
}
