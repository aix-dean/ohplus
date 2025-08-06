"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ITInventoryItem {
  id: string
  name: string
  description: string
  category: string
  status: string
  location: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: number
  supplier: string
  warrantyExpiry: string
  assignedTo: string
  notes: string
  createdAt: any
  updatedAt: any
  createdBy: string
}

const CATEGORIES = [
  "Computer Hardware",
  "Network Equipment",
  "Software",
  "Mobile Devices",
  "Peripherals",
  "Storage",
  "Security Equipment",
  "Other"
]

const STATUSES = [
  "Active",
  "Inactive",
  "Under Maintenance",
  "Retired",
  "Lost",
  "Damaged"
]

export default function ITInventoryEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isLoadingItem, setIsLoadingItem] = useState(true)
  const [item, setItem] = useState<ITInventoryItem | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    status: "",
    location: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
    supplier: "",
    warrantyExpiry: "",
    assignedTo: "",
    notes: ""
  })

  // Fetch item data
  useEffect(() => {
    async function fetchItem() {
      if (!params.id) return

      const itemId = Array.isArray(params.id) ? params.id[0] : params.id

      try {
        setIsLoadingItem(true)
        const itemDoc = await getDoc(doc(db, "it_inventory", itemId))

        if (!itemDoc.exists()) {
          setError("Item not found")
          return
        }

        const itemData = { id: itemDoc.id, ...itemDoc.data() } as ITInventoryItem
        setItem(itemData)

        // Initialize form data
        setFormData({
          name: itemData.name || "",
          description: itemData.description || "",
          category: itemData.category || "",
          status: itemData.status || "",
          location: itemData.location || "",
          serialNumber: itemData.serialNumber || "",
          purchaseDate: itemData.purchaseDate || "",
          purchasePrice: itemData.purchasePrice ? String(itemData.purchasePrice) : "",
          supplier: itemData.supplier || "",
          warrantyExpiry: itemData.warrantyExpiry || "",
          assignedTo: itemData.assignedTo || "",
          notes: itemData.notes || ""
        })
      } catch (error) {
        console.error("Error fetching item:", error)
        setError("Failed to load item data")
      } finally {
        setIsLoadingItem(false)
      }
    }

    fetchItem()
  }, [params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !item) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated or item not found.",
        variant: "destructive",
      })
      return
    }

    // Validation
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Item name is required.",
        variant: "destructive",
      })
      return
    }

    if (!formData.category) {
      toast({
        title: "Validation Error",
        description: "Category is required.",
        variant: "destructive",
      })
      return
    }

    if (!formData.status) {
      toast({
        title: "Validation Error",
        description: "Status is required.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status,
        location: formData.location.trim(),
        serialNumber: formData.serialNumber.trim(),
        purchaseDate: formData.purchaseDate,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
        supplier: formData.supplier.trim(),
        warrantyExpiry: formData.warrantyExpiry,
        assignedTo: formData.assignedTo.trim(),
        notes: formData.notes.trim(),
        updatedAt: new Date(),
      }

      await updateDoc(doc(db, "it_inventory", item.id), updateData)

      toast({
        title: "Item updated",
        description: "IT inventory item has been updated successfully.",
      })

      router.push("/it/inventory")
    } catch (error) {
      console.error("Error updating item:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update item. Please try again."
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to edit IT inventory items.</p>
        </div>
        <div className="mx-auto w-full max-w-6xl flex justify-center">
          <Button onClick={() => router.push("/login")}>Log In</Button>
        </div>
      </div>
    )
  }

  if (isLoadingItem) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <Button variant="ghost" onClick={handleBack} className="mb-6 w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-semibold">Edit IT Inventory Item</h1>
          <p className="text-muted-foreground">Loading item data...</p>
        </div>

        <div className="mx-auto w-full max-w-6xl flex justify-center">
          <div className="grid gap-6 w-full max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading Item Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!item || error) {
    return (
      <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <Button variant="ghost" onClick={handleBack} className="mb-6 w-fit">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to IT Inventory
          </Button>
          <h1 className="text-3xl font-semibold">Item Not Found</h1>
          <p className="text-muted-foreground">The IT inventory item you're trying to edit could not be found.</p>
        </div>

        <div className="mx-auto w-full max-w-6xl flex justify-center">
          <div className="grid gap-6 w-full max-w-2xl">
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 mb-6">The item you're trying to edit could not be found.</p>
                <Button onClick={() => router.push("/it/inventory")}>Return to IT Inventory</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
      <div className="mx-auto grid w-full max-w-6xl gap-2">
        <Button variant="ghost" onClick={handleBack} className="mb-6 w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to IT Inventory
        </Button>
        <h1 className="text-3xl font-semibold">Edit IT Inventory Item: {item.name}</h1>
        <p className="text-muted-foreground">Update the details of this IT inventory item.</p>
      </div>

      <div className="mx-auto w-full max-w-6xl flex justify-center">
        <div className="grid gap-6 w-full max-w-2xl">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
                <CardDescription>Update the information for this IT inventory item.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Item Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Dell OptiPlex 7090"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Brief description of the item..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleSelectChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      type="text"
                      placeholder="e.g., Office Floor 2"
                      value={formData.location}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      type="text"
                      placeholder="e.g., SN123456789"
                      value={formData.serialNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      name="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input
                      id="purchasePrice"
                      name="purchasePrice"
                      type="number"
                      placeholder="0.00"
                      value={formData.purchasePrice}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      name="supplier"
                      type="text"
                      placeholder="e.g., Dell Technologies"
                      value={formData.supplier}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                    <Input
                      id="warrantyExpiry"
                      name="warrantyExpiry"
                      type="date"
                      value={formData.warrantyExpiry}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    name="assignedTo"
                    type="text"
                    placeholder="e.g., John Doe"
                    value={formData.assignedTo}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes or comments..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                {error && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
                    <p className="text-sm">{error}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Item"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}
