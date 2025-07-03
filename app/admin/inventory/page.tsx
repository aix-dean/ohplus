"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon } from "lucide-react"
import { ResponsiveCardGrid } from "@/components/responsive-card-grid"
import { ProductInspector } from "@/components/product-inspector"
import { useTour } from "@/contexts/tour-context"

export default function InventoryPage() {
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const { highlightedElementId } = useTour()

  const handleAddProductClick = () => {
    setSelectedProduct(null)
    setIsInspectorOpen(true)
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setIsInspectorOpen(true)
  }

  const products = [
    {
      id: "1",
      name: "LED Billboard - EDSA",
      location: "EDSA, Mandaluyong",
      status: "Active",
      imageUrl: "/led-billboard-1.png",
    },
    {
      id: "2",
      name: "Static Billboard - C5",
      location: "C5, Taguig",
      status: "Maintenance",
      imageUrl: "/roadside-billboard.png",
    },
    {
      id: "3",
      name: "Digital Display - BGC",
      location: "Bonifacio Global City, Taguig",
      status: "Active",
      imageUrl: "/led-billboard-2.png",
    },
    {
      id: "4",
      name: "LED Wall - Makati",
      location: "Makati CBD",
      status: "Active",
      imageUrl: "/led-billboard-3.png",
    },
    {
      id: "5",
      name: "Rooftop Billboard - Quezon City",
      location: "Quezon City",
      status: "Inactive",
      imageUrl: "/led-billboard-4.png",
    },
  ]

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={handleAddProductClick} data-tour-id="add-site-button">
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </header>
      <main className="flex-1 p-4 overflow-auto">
        <ResponsiveCardGrid>
          {products.map((product) => (
            <Card key={product.id} className="flex flex-col">
              <img
                alt={product.name}
                className="aspect-video w-full rounded-t-lg object-cover"
                height="180"
                src={product.imageUrl || "/placeholder.svg"}
                width="320"
              />
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.location}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-gray-500">Status: {product.status}</p>
              </CardContent>
              <div className="p-4 border-t">
                <Button variant="outline" className="w-full bg-transparent" onClick={() => handleEditProduct(product)}>
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </ResponsiveCardGrid>
      </main>
      <ProductInspector isOpen={isInspectorOpen} onClose={() => setIsInspectorOpen(false)} product={selectedProduct} />
    </div>
  )
}
