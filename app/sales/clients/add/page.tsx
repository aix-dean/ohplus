"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, Upload, Plus, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { collection, getDocs, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service"
import { createClient } from "@/lib/client-service"

interface Company {
  id: string
  name: string
  address?: string
  industry?: string
  clientType?: string
  partnerType?: string
  companyLogoUrl?: string
  website?: string
  phone?: string
  created: Date
}

interface ContactPerson {
  id: string
  name: string
  designation: string
  phone: string
  email: string
  remarks: string
}

export default function AddClientPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [loading, setLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [companies, setCompanies] = useState<Company[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [showNewCompanyInput, setShowNewCompanyInput] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState("")

  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([])
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContact, setNewContact] = useState({
    name: "",
    designation: "",
    phone: "",
    email: "",
    remarks: "",
  })

  const [formData, setFormData] = useState({
    clientType: "",
    partnerType: "",
    company_id: "",
    company: "",
    industry: "",
    address: "",
    website: "",
    phone: "",
    companyLogoUrl: "",
  })

  const fetchCompanies = async () => {
    setLoadingCompanies(true)
    try {
      const companiesRef = collection(db, "client_company")
      const snapshot = await getDocs(companiesRef)
      const companiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        address: doc.data().address || "",
        industry: doc.data().industry || "",
        clientType: doc.data().clientType || "",
        partnerType: doc.data().partnerType || "",
        companyLogoUrl: doc.data().companyLogoUrl || "",
        website: doc.data().website || "",
        phone: doc.data().phone || "",
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

  useEffect(() => {
    fetchCompanies()
  }, [])

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
          website: selectedCompany.website || "",
          phone: selectedCompany.phone || "",
          companyLogoUrl: selectedCompany.companyLogoUrl || "",
        }))
        setLogoPreviewUrl(selectedCompany.companyLogoUrl || null)
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
        partnerType: formData.partnerType || "",
        website: formData.website,
        phone: formData.phone,
        companyLogoUrl: "",
        created: new Date(),
        user_company_id: userData?.company_id || "",
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating company:", error)
      throw error
    }
  }

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreviewUrl(URL.createObjectURL(file))
    } else {
      setLogoFile(null)
      setLogoPreviewUrl(formData.companyLogoUrl || null)
    }
  }

  const handleAddContact = () => {
    if (newContact.name && newContact.email && newContact.phone) {
      const contact: ContactPerson = {
        id: Date.now().toString(),
        ...newContact,
      }
      setContactPersons([...contactPersons, contact])
      setNewContact({
        name: "",
        designation: "",
        phone: "",
        email: "",
        remarks: "",
      })
      setShowAddContact(false)
    } else {
      toast.error("Please fill in required fields (Name, Email, Phone)")
    }
  }

  const handleRemoveContact = (id: string) => {
    setContactPersons(contactPersons.filter((c) => c.id !== id))
  }

  const fetchUserCompanyId = async (): Promise<string> => {
    try {
      if (!userData?.uid) return ""

      const companiesRef = collection(db, "client_company")
      const snapshot = await getDocs(companiesRef)

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
      if (contactPersons.length === 0) {
        toast.error("Please add at least one contact person")
        setLoading(false)
        return
      }

      const userCompanyId = await fetchUserCompanyId()

      let finalCompanyLogoUrl = formData.companyLogoUrl
      let finalCompanyId = formData.company_id
      let finalCompanyName = formData.company

      if (logoFile) {
        const uploadPath = `company_logos/new_client/`
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

      // Create multiple client documents for each contact person
      for (const contact of contactPersons) {
        const clientDataToSave = {
          clientType: formData.clientType,
          partnerType: formData.partnerType || "",
          company_id: finalCompanyId,
          company: finalCompanyName,
          industry: formData.industry || "",
          name: contact.name,
          designation: contact.designation,
          phone: contact.phone,
          email: contact.email,
          address: formData.address || "",
          companyLogoUrl: finalCompanyLogoUrl,
          status: "lead",
          notes: contact.remarks,
          city: "",
          state: "",
          zipCode: "",
          uploadedBy: userData?.uid || "",
          uploadedByName: userData?.displayName || userData?.email || "",
          user_company_id: userCompanyId,
        }

        await createClient(clientDataToSave)
      }

      toast.success(`Successfully added ${contactPersons.length} client contact(s)`)
      router.push("/sales/clients")
    } catch (error) {
      console.error("Error saving client:", error)
      toast.error("Failed to save client")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Toaster />

      {/* Header */}
      <header className="flex items-center gap-4 pb-6 mb-6 border-b border-gray-200">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Add Client</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company Information */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company Name:</Label>
                    {!showNewCompanyInput ? (
                      <Select value={formData.company_id} onValueChange={handleCompanySelect}>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingCompanies ? "Loading companies..." : "Company Name"} />
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

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry:</Label>
                    <Select value={formData.industry} onValueChange={(value) => handleSelectChange("industry", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="-Choose an Industry-" />
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

                  <div className="space-y-2">
                    <Label>Client Type:</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="clientType"
                          value="partner"
                          checked={formData.clientType === "partner"}
                          onChange={(e) => handleSelectChange("clientType", e.target.value)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="text-green-600">Partner</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="clientType"
                          value="brand"
                          checked={formData.clientType === "brand"}
                          onChange={(e) => handleSelectChange("clientType", e.target.value)}
                          className="w-4 h-4"
                        />
                        <span>Brand</span>
                      </label>
                    </div>
                  </div>

                  {formData.clientType === "partner" && (
                    <div className="space-y-2">
                      <Label htmlFor="partnerType">Partner Type:</Label>
                      <Select
                        value={formData.partnerType}
                        onValueChange={(value) => handleSelectChange("partnerType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="-Select Type-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="operator">Operator</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="address">Company Address:</Label>
                    <Select value={formData.address} onValueChange={(value) => handleSelectChange("address", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Company Address" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manila">Manila</SelectItem>
                        <SelectItem value="quezon-city">Quezon City</SelectItem>
                        <SelectItem value="makati">Makati</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website:</Label>
                    <Select value={formData.website} onValueChange={(value) => handleSelectChange("website", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Company Website" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Enter Custom URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Company Phone #:</Label>
                    <Select value={formData.phone} onValueChange={(value) => handleSelectChange("phone", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Company Phone #" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="custom">Enter Phone Number</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Logo:</Label>
                    <div
                      className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors overflow-hidden"
                      onClick={handleLogoClick}
                    >
                      {logoPreviewUrl ? (
                        <img
                          src={logoPreviewUrl || "/placeholder.svg"}
                          alt="Company Logo Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>DTI/BIR 2303</span>
                  <Button variant="outline" size="sm">
                    Upload Document
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>G.I.S.</span>
                  <Button variant="outline" size="sm">
                    Upload Document
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>ID with signature</span>
                  <Button variant="outline" size="sm">
                    Upload Document
                  </Button>
                </div>
                <Button variant="link" className="p-0 h-auto text-blue-600">
                  Add Compliance
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Contact Person</CardTitle>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Total: ({contactPersons.length})</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddContact(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {showAddContact && (
              <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <Input
                    placeholder="Name"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                  />
                  <Input
                    placeholder="Designation"
                    value={newContact.designation}
                    onChange={(e) => setNewContact({ ...newContact, designation: e.target.value })}
                  />
                  <Input
                    placeholder="Contact #"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  />
                  <Input
                    placeholder="Remarks"
                    value={newContact.remarks}
                    onChange={(e) => setNewContact({ ...newContact, remarks: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={handleAddContact} size="sm">
                    Add
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddContact(false)} size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Contact #</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactPersons.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>{contact.name}</TableCell>
                    <TableCell>{contact.designation}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.remarks}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRemoveContact(contact.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {contactPersons.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No contact persons added yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
