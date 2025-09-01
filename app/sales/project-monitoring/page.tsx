"use client"

import { useState } from "react"
import { ArrowLeft, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function ProjectMonitoringPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSite, setSelectedSite] = useState("")
  const router = useRouter()

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="p-1 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Project Bulletins</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 hover:bg-gray-200"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-48 bg-gray-50 border-gray-200">
                <SelectValue placeholder="-Select Site-" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site1">Site 1</SelectItem>
                <SelectItem value="site2">Site 2</SelectItem>
                <SelectItem value="site3">Site 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4">{/* Content will be added here */}</div>
    </div>
  )
}
