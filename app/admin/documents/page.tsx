"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeftIcon, SearchIcon, XIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminDocumentsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header matching the screenshot */}
      <header className="flex items-center gap-4 px-4 py-3 bg-adminHeaderDark text-white shadow-md">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-white">
          <ArrowLeftIcon className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-semibold">Documents</h1>
      </header>

      <main className="flex-1 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <Tabs defaultValue="contracts" className="w-full md:w-auto">
            <TabsList className="grid w-full grid-cols-2 md:w-[200px]">
              <TabsTrigger value="contracts">Contracts</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>
            <TabsContent value="contracts" className="mt-4">
              <div className="relative flex items-center w-full max-w-sm mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <div className="flex flex-wrap gap-2 mb-6">
                <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple/90">
                  +Create Contract
                </Button>
                <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple/90">Templates</Button>
                <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple/90">Drafts</Button>
              </div>
              <div className="flex flex-col items-center justify-center h-[300px] border border-dashed rounded-lg text-gray-500">
                <p className="text-lg">No contracts yet.</p>
                <a href="#" className="text-blue-600 hover:underline mt-2">
                  Add Template?
                </a>
              </div>
            </TabsContent>
            <TabsContent value="invoices" className="mt-4">
              <div className="relative flex items-center w-full max-w-sm mb-4">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-8 text-sm focus:border-blue-500 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
              <div className="flex flex-wrap gap-2 mb-6">
                <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple/90">
                  +Create Invoice
                </Button>
                <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple/90">Templates</Button>
                <Button className="bg-adminHeaderPurple text-white hover:bg-adminHeaderPurple/90">Drafts</Button>
              </div>
              <div className="flex flex-col items-center justify-center h-[300px] border border-dashed rounded-lg text-gray-500">
                <p className="text-lg">No invoices yet.</p>
                <a href="#" className="text-blue-600 hover:underline mt-2">
                  Add Template?
                </a>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
