"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import StaticSitesTab from "./static-sites"
import LEDSitesTab from "./led-sites"
import AllSitesTab from "./all-sites" // Import the new component
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ServiceAssignmentDialog } from "@/components/service-assignment-dialog"
import { CardContent } from "@/components/ui/card"

// Update the page title
export default function LogisticsDashboardPage() {
  const [siteType, setSiteType] = useState<"static" | "led" | "all">("static")
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="flex-1 overflow-auto relative">
      <main className="p-4">
        <div className="flex flex-col gap-4">
          {/* Site Type Tabs */}
          <Tabs defaultValue="static" className="w-full" onValueChange={(value) => setSiteType(value as any)}>
            <TabsList className="grid w-[350px] grid-cols-3">
              <TabsTrigger value="static">Static Sites</TabsTrigger>
              <TabsTrigger value="led">LED Sites</TabsTrigger>
              <TabsTrigger value="all">All Sites</TabsTrigger>
            </TabsList>

            <TabsContent value="static" className="mt-4">
              <StaticSitesTab />
            </TabsContent>

            <TabsContent value="led" className="mt-4">
              <LEDSitesTab />
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <AllSitesTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-8 right-8 z-10">
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg h-14 px-6"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" /> Create Service Assignment
        </Button>
      </div>

      {/* Service Assignment Dialog */}
      <ServiceAssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          // You could add a success toast notification here
        }}
      />
    </div>
  )
}

const product = {
  name: "Example Product",
  price: 19.99,
}

const siteCode = "S123"

const formattedPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(product.price)

function ProductCard() {
  return (
    <CardContent className="p-4">
      <div className="flex flex-col">
        {siteCode && <span className="text-xs text-gray-700 mb-1">Site Code: {siteCode}</span>}

        <h3 className="font-semibold line-clamp-1">{product.name}</h3>

        <div className="mt-2 text-sm font-medium text-green-700">{formattedPrice}</div>
        <Button
          variant="outline"
          className="mt-4 w-full rounded-full bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
        >
          Create Report
        </Button>
      </div>
    </CardContent>
  )
}
