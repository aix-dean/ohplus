"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminDocumentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("contracts")

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col h-full p-4">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-gray-700 hover:bg-gray-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Documents</h1>
      </div>

      {/* Tabs and Action Buttons */}
      <div className="flex justify-between items-center mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:w-[200px] bg-gray-100">
            <TabsTrigger
              value="contracts"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Contracts
            </TabsTrigger>
            <TabsTrigger
              value="invoices"
              className="data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Invoices
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2 ml-auto">
          <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple-light">+Create Contract</Button>
          <Button
            variant="outline"
            className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple-light border-adminHeaderPurple"
          >
            Templates
          </Button>
          <Button
            variant="outline"
            className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple-light border-adminHeaderPurple"
          >
            Drafts
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-9 pr-8 py-2 rounded-md border border-input focus:ring-1 focus:ring-primary focus:border-primary"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:bg-transparent"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Content Area - Empty State */}
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
        <div>
          <p className="mb-2">No contracts yet.</p>
          <a href="#" className="text-primary hover:underline">
            Add Template?
          </a>
        </div>
      </div>
    </div>
  )
}
