"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react" // Import useRef
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
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ClientDialogProps {
  client?: Client
  onSuccess?: (client: Client) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Company {
  id: string
  name: string
  created: Date
}

export function ClientDialog({ client, onSuccess, open, onOpenChange }: ClientDialogProps) {
  const { user } = useAuth() // Get current user from auth context
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for hidden file input

  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState("")

  const [formData, setFormData] = useState({
    clientType: client?.clientType || "",
    partnerType: client?.partnerType || "",
    company_id: client?.company_id || "",
    company: client?.company || "",
    industry: client?.industry || "",
    name: client?.name || "", // Contact Person Name
    designation: client?.designation || "", // New field
    phone: client?.phone || "", // Contact Details Phone
    email: client?.email || "", // Contact Details Email
    address: client?.address || "", // Company Address
    companyLogoUrl: client?.companyLogoUrl || "", // Existing logo URL
  })

  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const companiesRef = collection(db, "client_company")
      const snapshot = await getDocs(companiesRef)
      const companiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        created: doc.data().created?.toDate() || new Date(),
      }))
      setCompanies(companiesData)
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast.error("Failed to load companies")
    } finally {
      setLoadingCompanies(false)
    }
  }

  // Reset form data and logo states when dialog opens for a new client or when client prop changes
  useEffect(() => {
    if (open) {
      setFormData({
        clientType: client?.clientType || "",
        partnerType: client?.partnerType || "",
        company_id: client?.company_id || "",
        company: client?.company || "",
        industry: client?.industry || "",
        name: client?.name || "",
        designation: client?.designation || "",
        phone: client?.phone || "",
        email: client?.email || "",
        address: client?.address || "",
        companyLogoUrl: client?.companyLogoUrl || "",
      })
      setLogoFile(null) // Clear selected file
      setLogoPreviewUrl(client?.companyLogoUrl || null) // Set preview to existing logo or null
      setShowNewCompanyInput(false)
      setNewCompanyName("")
      fetchCompanies()
    }
  }, [open, client])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "clientType" && value === "brand") {
      setFormData((prev) => ({ ...prev, partnerType: "" }))
    }
  }

  const handleCompanySelect = (value: string) => {
    if (value === "add_new") {
      setShowNewCompanyInput(true)
      setFormData((prev) => ({
        ...prev,
        company: "",
        company_id: "",
      }))
    } else {
      const selectedCompany = companies.find((c) => c.id === value)
      if (selectedCompany) {
        setFormData((prev) => ({
          ...prev,
          company: selectedCompany.name,
          company_id: selectedCompany.id,
        }))
        setShowNewCompanyInput(false)
      }
    }
  }

  const createNewCompany = async (companyName: string) => {
    try {
      const companiesRef = collection(db, "client_company")
      const docRef = await addDoc(companiesRef, {
        name: companyName,
        address: formData.address,
        industry: formData.industry,
        clientType: formData.clientType,
        companyLogoUrl: "", // Will be updated after logo upload if needed
        created: new Date(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating company:", error)
      throw error
    }
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
      let finalCompanyId = formData.company_id
      let finalCompanyName = formData.company

      if (logoFile) {
        const uploadPath = `company_logos/${client?.id || "new_client"}/`
        finalCompanyLogoUrl = await uploadFileToFirebaseStorage(logoFile, uploadPath)
      }

      if (showNewCompanyInput && newCompanyName.trim()) {
        setFormData((prev) => ({ ...prev, companyLogoUrl: finalCompanyLogoUrl }))
        finalCompanyId = await createNewCompany(newCompanyName.trim())
        finalCompanyName = newCompanyName.trim()

        if (finalCompanyLogoUrl && finalCompanyLogoUrl !== formData.companyLogoUrl) {
          await updateDoc(doc(db, "client_company", finalCompanyId), {
            companyLogoUrl: finalCompanyLogoUrl,
          })
        }
      }

      const clientDataToSave = {
        ...formData,
        company_id: finalCompanyId,
        company: finalCompanyName,
        companyLogoUrl: finalCompanyLogoUrl, // Use the uploaded URL or existing one
        // Ensure required fields are not undefined if they come from optional props
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
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
            <div className="space-y-2">
              <Label htmlFor="clientType">Client Type:</Label>
              <Select value={formData.clientType} onValueChange={(value) => handleSelectChange("clientType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="brand">Brand</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.clientType === "partner" && (
              <div className="space-y-2">
                <Label htmlFor="partnerType">Partner Type:</Label>
                <Select
                  value={formData.partnerType}
                  onValueChange={(value) => handleSelectChange("partnerType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select partner type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operator">Operator</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="company">Company Name:</Label>
              {!showNewCompanyInput ? (
                <Select value={formData.company_id} onValueChange={handleCompanySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Select or add company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add_new">+ Add New Company</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="Enter new company name"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewCompanyInput(false)
                      setNewCompanyName("")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
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
