"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/components/ui/use-toast"

interface CompanyRegistrationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

interface CompanyFormData {
  name: string
  business_type: string
  position: string
  website: string
  address: {
    street: string
    city: string
    province: string
  }
}

export function CompanyRegistrationDialog({ isOpen, onClose, onSuccess, userId }: CompanyRegistrationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CompanyFormData>({
    name: "",
    business_type: "",
    position: "",
    website: "",
    address: {
      street: "",
      city: "",
      province: "",
    },
  })

  const businessTypes = [
    "Advertising Agency",
    "Media Company",
    "Technology",
    "Retail",
    "Real Estate",
    "Healthcare",
    "Education",
    "Finance",
    "Other",
  ]

  const philippineProvinces = [
    "Metro Manila",
    "Cebu",
    "Davao",
    "Laguna",
    "Cavite",
    "Bulacan",
    "Rizal",
    "Batangas",
    "Pampanga",
    "Pangasinan",
    "Other",
  ]

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith("address.")) {
      const addressField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.name || !formData.business_type || !formData.position) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Create company document
      const companyData = {
        name: formData.name,
        business_type: formData.business_type,
        position: formData.position,
        website: formData.website || "",
        address: {
          street: formData.address.street || "",
          city: formData.address.city || "",
          province: formData.address.province || "",
        },
        created_by: userId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      // Add company to companies collection
      const companyRef = await addDoc(collection(db, "companies"), companyData)

      // Update user document with company_id
      const userRef = doc(db, "iboard_users", userId)
      await updateDoc(userRef, {
        company_id: companyRef.id,
        updated: serverTimestamp(),
      })

      toast({
        title: "Company Registered",
        description: "Your company has been successfully registered.",
      })

      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error registering company:", error)
      toast({
        title: "Registration Failed",
        description: "Failed to register company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Company Registration</DialogTitle>
          <DialogDescription>
            Please provide your company details to continue using the inventory system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company-name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter company name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-type">
              Business Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.business_type}
              onValueChange={(value) => handleInputChange("business_type", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">
              Your Position <span className="text-red-500">*</span>
            </Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange("position", e.target.value)}
              placeholder="e.g., CEO, Manager, Director"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://www.example.com"
              type="url"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">Address</Label>

            <div className="space-y-2">
              <Label htmlFor="street" className="text-sm">
                Street Address
              </Label>
              <Input
                id="street"
                value={formData.address.street}
                onChange={(e) => handleInputChange("address.street", e.target.value)}
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm">
                  City
                </Label>
                <Input
                  id="city"
                  value={formData.address.city}
                  onChange={(e) => handleInputChange("address.city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="text-sm">
                  Province
                </Label>
                <Select
                  value={formData.address.province}
                  onValueChange={(value) => handleInputChange("address.province", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {philippineProvinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Company
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
