"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, X } from "lucide-react"

export default function AdminDocumentsPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white">
        <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold ml-2">Documents</h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          {/* Tabs and Search */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full md:w-auto">
            <Tabs defaultValue="contracts" className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="contracts">Contracts</TabsTrigger>
                <TabsTrigger value="invoices">Invoices</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative flex items-center w-full md:max-w-xs">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search..." className="pl-9 pr-8 w-full" aria-label="Search documents" />
              <Button variant="ghost" size="icon" className="absolute right-1 h-7 w-7" aria-label="Clear search">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-end">
            <Button className="bg-[#673AB7] hover:bg-[#5e33a6] text-white">+Create Contract</Button>
            <Button variant="outline" className="bg-[#673AB7] hover:bg-[#5e33a6] text-white border-transparent">
              Templates
            </Button>
            <Button variant="outline" className="bg-[#673AB7] hover:bg-[#5e33a6] text-white border-transparent">
              Drafts
            </Button>
          </div>
        </div>

        {/* No Contracts Yet Message */}
        <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] text-center text-muted-foreground">
          <p className="text-lg">No contracts yet.</p>
          <a href="#" className="text-blue-600 hover:underline mt-2">
            Add Template?
          </a>
        </div>
      </div>
    </div>
  )
}
