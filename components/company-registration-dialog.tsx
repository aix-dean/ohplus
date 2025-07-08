"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/auth-context"
import { doc, setDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CompanyRegistrationDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CompanyData {
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

export function CompanyRegistrationDialog({ isOpen, onClose, onSuccess }: CompanyRegistrationDialogProps) {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [companyData, setCompanyData] = useState<CompanyData>({
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
    "Real Estate",
    "Retail",
    "Technology",
    "Healthcare",
    "Education",
    "Finance",
    "Entertainment",
    "Other",
  ]

  const handleInputChange = (field: keyof CompanyData, value: string) => {
    if (field === "address") return
    setCompanyData((prev) => ({ ...prev, [field]: value }))
  }

  const handleAddressChange = (field: keyof CompanyData["address"], value: string) => {
    setCompanyData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }))
  }

  const validateForm = () => {
    if (!companyData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      })
      return false
    }

    if (!companyData.business_type) {
      toast({
        title: "Validation Error",
        description: "Business type is required.",
        variant: "destructive",
      })
      return false
    }

    if (!companyData.position.trim()) {
      toast({
        title: "Validation Error",
        description: "Your position is required.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !userData?.uid) return

    setLoading(true)
    try {
      // Generate a new company ID
      const companyId = doc(db, "companies", "temp").id

      // Prepare company document
      const companyDoc = {
        ...companyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userData.uid,
        updatedAt: new Date().toISOString(),
      }

      // Save company to companies collection
      await setDoc(doc(db, "companies", companyId), companyDoc)

      // Update user document with company_id
      await updateDoc(doc(db, "iboard_users", userData.uid), {
        company_id: companyId,
      })

      toast({
        title: "Success",
        description: "Company registered successfully!",
      })

      onSuccess()
    } catch (error) {
      console.error("Error registering company:", error)
      toast({
        title: "Error",
        description: "Failed to register company. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register Your Company</DialogTitle>
          <DialogDescription>
            Please provide your company information to continue adding sites to your inventory.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="company_name"
                value={companyData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter company name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="business_type">
                Business Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={companyData.business_type}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">
                Your Position <span className="text-red-500">*</span>
              </Label>
              <Input
                id="position"
                value={companyData.position}
                onChange={(e) => handleInputChange("position", e.target.value)}
                placeholder="e.g., CEO, Manager, Director"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={companyData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                placeholder="https://www.example.com"
                type="url"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Company Address</Label>

            <div className="space-y-2">
              <Label htmlFor="street">Street Address</Label>
              <Textarea
                id="street"
                value={companyData.address.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                placeholder="Enter street address"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={companyData.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={companyData.address.province}
                  onChange={(e) => handleAddressChange("province", e.target.value)}
                  placeholder="Enter province"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register Company
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
