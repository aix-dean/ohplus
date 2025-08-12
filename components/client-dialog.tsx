"use client"

import type React from "react"
import { useRef, useState } from "react" // Import useRef
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient, updateClient, type Client } from "@/lib/client-service"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service" // Import the upload function
import { useAuth } from "@/contexts/auth-context" // Import useAuth

interface ClientDialogProps {
  client?: Client
  onSuccess?: (client: Client) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ClientDialog({ client, onSuccess, open, onOpenChange }: ClientDialogProps) {
  const { user } = useAuth() // Get current user from auth context
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for hidden file input

  const [formData, setFormData] = useState({
    company: client?.company || "",
    industry: client?.industry || "",
    name: client?.name || "", // Contact Person Name
    designation: client?.designation || "", // New field
    phone: client?.phone || "", // Contact Details Phone
    email: client?.email || "", // Contact Details Email
    address: client?.address || "", // Company Address
    companyLogoUrl: client?.companyLogoUrl || "", // Existing logo URL
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click() // Trigger hidden file input click
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreviewUrl(URL.createObjectURL(file)) // Create a local URL for preview
    } else {
      setLogoFile(null)
      setLogoPreviewUrl(client?.companyLogoUrl || null) // Revert to existing or null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let finalCompanyLogoUrl = formData.companyLogoUrl

      if (logoFile) {
        // Only upload if a new file is selected
        const uploadPath = `company_logos/${client?.id || "new_client"}/` // Use client ID if editing, or 'new_client'
        finalCompanyLogoUrl = await uploadFileToFirebaseStorage(logoFile, uploadPath)
      }

      const clientDataToSave = {
        ...formData,
        companyLogoUrl: finalCompanyLogoUrl, // Use the uploaded URL or existing one
        // Ensure required fields are not undefined if they come from optional props
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        company: formData.company || "",
        industry: formData.industry || "",
        address: formData.address || "",
        designation: formData.designation || "",
        // Default status and empty notes/city/state/zipCode if not explicitly handled by new UI
        status: client?.status || "lead",
        notes: client?.notes || "",
        city: client?.city || "",
        state: client?.state || "",
        zipCode: client?.zipCode || "",
        // Add uploadedBy and uploadedByName for new clients
        uploadedBy: client?.uploadedBy || user?.uid || "",
        uploadedByName: client?.uploadedByName || user?.displayName || user?.email || "",
      } as Omit<Client, "id" | "created" | "updated"> // Cast to ensure type compatibility

      let savedClient: Client

      if (client?.id) {
        await updateClient(client.id, clientDataToSave)
        savedClient = { id: client.id, ...clientDataToSave, created: client.created, updated: new Date() } as Client // Mock updated client
        toast.success("Client updated successfully")
      } else {
        const newClientId = await createClient(clientDataToSave)
        savedClient = { id: newClientId, ...clientDataToSave, created: new Date(), updated: new Date() } as Client // Mock created client
        toast.success("Client added successfully")
      }

      onOpenChange(false)
      if (onSuccess) onSuccess(savedClient)
    } catch (error) {
      console.error("Error saving client:", error)
      toast.error("Failed to save client")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company">Company Name:</Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="XYZ Company"
                required
              />
            </div>

            {/* Industry */}
            <div className="space-y-2">
              <Label htmlFor="industry">Industry:</Label>
              <Select value={formData.industry} onValueChange={(value) => handleSelectChange("industry", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="-Select-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Contact Person:</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Name" required />
              <Input
                id="designation"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Designation"
              />
            </div>

            {/* Contact Details */}
            <div className="space-y-2 md:col-span-2">
              <Label>Contact Details:</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone Number"
                required
              />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                required
              />
            </div>

            {/* Address */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="address">Address:</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Company Address"
              />
            </div>

            {/* Company Logo */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="companyLogo">
                Company Logo: <span className="text-green-600">(Optional)</span>
              </Label>
              <div
                className="w-24 h-24 border border-gray-300 rounded-lg flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                onClick={handleLogoClick}
              >
                {logoPreviewUrl ? (
                  <img
                    src={logoPreviewUrl || "/placeholder.svg"}
                    alt="Company Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Plus className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*" // Only accept image files
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Client Information"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export both as named and default export to support different import patterns
export { ClientDialog }
export default ClientDialog
