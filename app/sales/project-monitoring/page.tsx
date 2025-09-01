"use client"

import { ArrowLeft, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ProjectMonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="flex items-center justify-between p-4">
          {/* Header with back arrow and title */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="p-1">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Project Bulletins</h1>
          </div>
        </div>

        {/* Search bar and site selector */}
        <div className="flex items-center justify-between gap-4 px-4 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="" className="pl-10 bg-gray-50 border-gray-200" />
          </div>

          <Select defaultValue="">
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

      {/* Main content area - currently empty as requested */}
      <div className="p-4">{/* Content will be added here */}</div>
    </div>
  )
}
