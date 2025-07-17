"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { getProductById, updateProduct, type Product } from "@/lib/firebase-service"
import { toast } from "@/components/ui/use-toast"
import { BusinessSideNavigation } from "@/components/business-side-navigation"

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    status: "active",
    specs_rental: {
      location: "",
      type: "",
      width: "",
      height: "",
      unit: "m",
      orientation: "landscape",
      illumination: "yes",
    },
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(params.id)
        setProduct(productData)
        setFormData({
          name: productData.name || "",
          description: productData.description || "",
          price: productData.price ? String(productData.price) : "",
          status: productData.status || "active",
          specs_rental: {
            location: productData.specs_rental?.location || "",
            type: productData.specs_rental?.type || "",
            width: productData.specs_rental?.width ? String(productData.specs_rental.width) : "",
            height: productData.specs_rental?.height ? String(productData.specs_rental.height) : "",
            unit: productData.specs_rental?.unit || "m",
            orientation: productData.specs_rental?.orientation || "landscape",
            illumination: productData.specs_rental?.illumination || "yes",
          },
        })
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load product details. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.id])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSpecsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      specs_rental: {
        ...prev.specs_rental,
        [name]: value,
      },
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name.startsWith("specs_rental.")) {
      const specName = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        specs_rental: {
          ...prev.specs_rental,
          [specName]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    setSaving(true)
    try {
      // Convert price to number
      const updatedProduct = {
        ...product,
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        status: formData.status,
        specs_rental: {
          ...formData.specs_rental,
          width: formData.specs_rental.width ? Number.parseFloat(formData.specs_rental.width) : null,
          height: formData.specs_rental.height ? Number.parseFloat(formData.specs_rental.height) : null,
        },
        updated_at: new Date().toISOString(),
      }

      await updateProduct(product.id, updatedProduct)
      toast({
        title: "Product updated",
        description: "The product has been successfully updated.",
      })
      router.push(`/business/inventory/${product.id}`)
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "Error",
        description: "Failed to update the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleBackClick = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <BusinessSideNavigation />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex min-h-screen">
        <BusinessSideNavigation />
        <div className="flex-1 p-4 md:p-6 ml-0 lg:ml-64">
          <Button variant="ghost" onClick={handleBackClick} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-2">Product not found</div>
            <div className="text-gray-400 text-sm">
              The product you are trying to edit does not exist or has been deleted.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <BusinessSideNavigation />
      <div className="flex-1 p-4 md:p-6 ml-0 lg:ml-64">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackClick} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Product
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Product name"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Product description"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="price">Price (₱)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Specifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.specs_rental.location}
                      onChange={handleSpecsChange}
                      placeholder="Location"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      name="type"
                      value={formData.specs_rental.type}
                      onChange={handleSpecsChange}
                      placeholder="Billboard type"
                    />
                  </div>

                  <div>
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      name="width"
                      type="number"
                      step="0.01"
                      value={formData.specs_rental.width}
                      onChange={handleSpecsChange}
                      placeholder="Width"
                    />
                  </div>

                  <div>
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      name="height"
                      type="number"
                      step="0.01"
                      value={formData.specs_rental.height}
                      onChange={handleSpecsChange}
                      placeholder="Height"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select
                      value={formData.specs_rental.unit}
                      onValueChange={(value) => handleSelectChange("specs_rental.unit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="m">Meters (m)</SelectItem>
                        <SelectItem value="ft">Feet (ft)</SelectItem>
                        <SelectItem value="px">Pixels (px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="orientation">Orientation</Label>
                    <Select
                      value={formData.specs_rental.orientation}
                      onValueChange={(value) => handleSelectChange("specs_rental.orientation", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select orientation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">Landscape</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="illumination">Illumination</Label>
                    <Select
                      value={formData.specs_rental.illumination}
                      onValueChange={(value) => handleSelectChange("specs_rental.illumination", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select illumination" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Yes</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
