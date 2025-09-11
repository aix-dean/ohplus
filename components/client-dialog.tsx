"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react" // Import useRef
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient, updateClient, type Client, type ClientCompany } from "@/lib/client-service"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service" // Import the upload function
import { useAuth } from "@/contexts/auth-context" // Import useAuth
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ClientDialogProps {
  client?: Client
  onSuccess?: (client: Client) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ClientDialog({ client, onSuccess, open, onOpenChange }: ClientDialogProps) {
  const { userData } = useAuth() // Get current user from auth context
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for hidden file input

  const [companies, setCompanies] = useState<ClientCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState("")

  // Compliance file states
  const [complianceFiles, setComplianceFiles] = useState({
    dti: null as File | null,
    gis: null as File | null,
    id: null as File | null,
  })

  // File input refs for compliance documents
  const dtiFileInputRef = useRef<HTMLInputElement>(null)
  const gisFileInputRef = useRef<HTMLInputElement>(null)
  const idFileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    clientType: client?.clientType || "",
    partnerType: client?.partnerType || "",
    company_id: client?.company_id || "",
    company: client?.company || "",
    industry: client?.industry || "",
    website: client?.website || "",
    phone: client?.phone || "",
    address: client?.address || "",
    companyLogoUrl: client?.companyLogoUrl || "",
    name: client?.name || "", // Contact Person Name
    designation: client?.designation || "", // New field
    email: client?.email || "", // Contact Details Email
    user_company_id: client?.user_company_id || userData?.company_id || "", // New field
  })

  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const companiesRef = collection(db, "client_company")
      const q = query(
        companiesRef,
        where("user_company_id", "==", userData?.company_id || ""),
        where("deleted", "!=", true)
      )
      const snapshot = await getDocs(q)
      const companiesData = snapshot.docs.map((doc) => {
        const data = doc.data() as any
        return {
          id: doc.id,
          name: data.name,
          address: data.address || "",
          industry: data.industry || "",
          clientType: data.clientType || "",
          partnerType: data.partnerType || "", // Include partner type in fetched data
          companyLogoUrl: data.companyLogoUrl || "",
          created: data.created?.toDate() || new Date(),
          user_company_id: data.user_company_id || "", // Include user_company_id
        }
      })
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
        website: (client as any)?.website || "",
        phone: client?.phone || "",
        address: client?.address || "",
        companyLogoUrl: client?.companyLogoUrl || "",
        name: client?.name || "",
        designation: client?.designation || "",
        email: client?.email || "",
        user_company_id: client?.user_company_id || userData?.company_id || "", // New field
      })
      setLogoFile(null) // Clear selected file
      setLogoPreviewUrl(client?.companyLogoUrl || null) // Set preview to existing logo or null
      setShowNewCompanyInput(false)
      setNewCompanyName("")
      fetchCompanies()
    }
  }, [open, client, userData?.company_id]) // Added userData?.company_id to dependency array

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

  const handleCompanySelect = async (value: string) => {
    if (value === "add_new") {
      setShowNewCompanyInput(true)
      setFormData((prev) => ({
        ...prev,
        company: "",
        company_id: "",
        address: "",
        industry: "",
        clientType: "",
        partnerType: "",
        website: "",
        phone: "",
        companyLogoUrl: "",
      }))
      setLogoPreviewUrl(null)
    } else {
      const selectedCompany = companies.find((c) => c.id === value)
      if (selectedCompany) {
        setFormData((prev) => ({
          ...prev,
          company: selectedCompany.name,
          company_id: selectedCompany.id,
          address: selectedCompany.address || "",
          industry: selectedCompany.industry || "",
          clientType: selectedCompany.clientType || "",
          partnerType: selectedCompany.partnerType || "",
          website: (selectedCompany as any).website || "",
          phone: (selectedCompany as any).phone || "",
          companyLogoUrl: selectedCompany.companyLogoUrl || "",
          name: "",
          designation: "",
          email: "",
        }))
        setLogoPreviewUrl(selectedCompany.companyLogoUrl || null)
        setShowNewCompanyInput(false)
      }
    }
  }

  const createNewCompany = async (companyName: string) => {
    try {
      const companiesRef = collection(db, "client_company")

      // Upload compliance files if they exist
      const complianceUrls = {
        dti: "",
        gis: "",
        id: "",
      }

      if (complianceFiles.dti) {
        const uploadPath = `compliance_documents/${userData?.uid || "unknown"}/dti/`
        complianceUrls.dti = await uploadFileToFirebaseStorage(complianceFiles.dti, uploadPath)
      }

      if (complianceFiles.gis) {
        const uploadPath = `compliance_documents/${userData?.uid || "unknown"}/gis/`
        complianceUrls.gis = await uploadFileToFirebaseStorage(complianceFiles.gis, uploadPath)
      }

      if (complianceFiles.id) {
        const uploadPath = `compliance_documents/${userData?.uid || "unknown"}/id/`
        complianceUrls.id = await uploadFileToFirebaseStorage(complianceFiles.id, uploadPath)
      }

      const docRef = await addDoc(companiesRef, {
        name: companyName,
        address: formData.address,
        industry: formData.industry,
        clientType: formData.clientType,
        partnerType: formData.partnerType || "",
        website: formData.website,
        phone: formData.phone,
        companyLogoUrl: "", // Will be updated after logo upload if needed
        created: new Date(),
        user_company_id: userData?.company_id || "",
        deleted: false,
        compliance: {
          dti: complianceUrls.dti,
          gis: complianceUrls.gis,
          id: complianceUrls.id,
          uploadedAt: new Date(),
          uploadedBy: userData?.uid || "",
        },
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

  const handleComplianceFileChange = (type: "dti" | "gis" | "id") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setComplianceFiles((prev) => ({ ...prev, [type]: file }))
      toast.success(`${type.toUpperCase()} document selected`)
    }
  }

  const handleComplianceUpload = (type: "dti" | "gis" | "id") => {
    const fileInputRefs = {
      dti: dtiFileInputRef,
      gis: gisFileInputRef,
      id: idFileInputRef,
    }
    fileInputRefs[type].current?.click()
  }

  const fetchUserCompanyId = async (): Promise<string> => {
    try {
      if (!userData?.uid) return ""

      const companiesRef = collection(db, "client_company")
      const q = query(companiesRef, where("deleted", "!=", true))
      const snapshot = await getDocs(q)

      // Find the company that belongs to the current user
      const userCompany = snapshot.docs.find((doc) => {
        const data = doc.data()
        return data.user_company_id === userData.uid || data.created_by === userData.uid
      })

      return userCompany?.id || userData?.company_id || ""
    } catch (error) {
      console.error("Error fetching user company ID:", error)
      return userData?.company_id || ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const userCompanyId = await fetchUserCompanyId()

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
        name: formData.name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        industry: formData.industry || "",
        address: formData.address || "",
        designation: formData.designation || "",
        status: client?.status || "lead",
        notes: client?.notes || "",
        city: client?.city || "",
        state: client?.state || "",
        zipCode: client?.zipCode || "",
        uploadedBy: client?.uploadedBy || userData?.uid || "",
        uploadedByName: client?.uploadedByName || userData?.displayName || userData?.email || "",
        user_company_id: formData.user_company_id, // Use formData's user_company_id
        deleted: false,
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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {showNewCompanyInput && (
              <>
                {/* Industry and Client Type */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry:</Label>
                  <Select value={formData.industry} onValueChange={(value) => handleSelectChange("industry", value)}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="-Select an Industry-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="banking">Banking & Financial Services</SelectItem>
                      <SelectItem value="beverages">Beverages</SelectItem>
                      <SelectItem value="fast_food">Fast Food & QSR</SelectItem>
                      <SelectItem value="retail">Retail & Shopping</SelectItem>
                      <SelectItem value="telecom">Telecommunications</SelectItem>
                      <SelectItem value="pharmaceuticals">Pharmaceuticals</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="government">Government & Public Services</SelectItem>
                      <SelectItem value="fmcg">FMCG</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="entertainment">Entertainment & Media</SelectItem>
                      <SelectItem value="travel">Travel & Tourism</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientType">Client Type:</Label>
                  <Select value={formData.clientType} onValueChange={(value) => handleSelectChange("clientType", value)}>
                    <SelectTrigger className="h-10">
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
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select partner type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="operator">Operator</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Address and Website */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Company Address:</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Company Address"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Company Website:</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="Company Website"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Company Phone #:</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Company Phone #"
                    className="h-10"
                  />
                </div>

                {/* Company Logo */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="companyLogo">Company Logo: <span className="text-green-600">(Optional)</span></Label>
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
                    accept="image/*"
                  />
                </div>

                {/* Compliance Section */}
                <div className="md:col-span-2">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance</h3>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">DTI/BIR 2303</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                          onClick={() => handleComplianceUpload("dti")}
                        >
                          {complianceFiles.dti ? "Document Selected" : "Upload Document"}
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">G.I.S.</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                          onClick={() => handleComplianceUpload("gis")}
                        >
                          {complianceFiles.gis ? "Document Selected" : "Upload Document"}
                        </Button>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">ID with signature</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs bg-transparent"
                          onClick={() => handleComplianceUpload("id")}
                        >
                          {complianceFiles.id ? "Document Selected" : "Upload Document"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Hide client type, industry, address, and logo when selecting existing company */}
            {/* These fields are only shown when creating a new company (showNewCompanyInput = true) */}

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

        {/* Hidden file inputs for compliance documents */}
        <input
          type="file"
          ref={dtiFileInputRef}
          onChange={handleComplianceFileChange("dti")}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <input
          type="file"
          ref={gisFileInputRef}
          onChange={handleComplianceFileChange("gis")}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        <input
          type="file"
          ref={idFileInputRef}
          onChange={handleComplianceFileChange("id")}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
      </DialogContent>
    </Dialog>
  )
}
