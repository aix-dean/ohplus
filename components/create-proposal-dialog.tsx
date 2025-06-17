"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Download, Eye, Loader2, CheckCircle } from "lucide-react" // Removed CalendarIcon
import { format, parseISO } from "date-fns" // Added parseISO
import { cn } from "@/lib/utils"
import { createProposal } from "@/lib/proposal-service"
import type { Product } from "@/lib/firebase-service"
import type { ProposalClient, ProposalProduct } from "@/lib/types/proposal"
import Image from "next/image"
import { useDebounce } from "@/hooks/use-debounce"
import { getPaginatedClients, createClient, type Client } from "@/lib/client-service"

interface CreateProposalDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedProducts: Product[]
  onProposalCreated: () => void
}

export function CreateProposalDialog({
  isOpen,
  onClose,
  selectedProducts,
  onProposalCreated,
}: CreateProposalDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Form state
  const [title, setTitle] = useState("")
  const [client, setClient] = useState<ProposalClient>({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
    targetAudience: "",
    campaignObjective: "",
  })
  // Initialize validUntil as a Date object, convert to string for input value
  const [validUntil, setValidUntil] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState("")
  const [step, setStep] = useState<"details" | "preview">("details")

  // Client selection state
  const [clientSelectionMode, setClientSelectionMode] = useState<"new" | "existing">("new")
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [selectedExistingClient, setSelectedExistingClient] = useState<Client | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Removed popover open states

  useEffect(() => {
    const fetchClients = async () => {
      if (debouncedSearchTerm.trim()) {
        setIsSearchingClients(true)
        try {
          const result = await getPaginatedClients(10, null, debouncedSearchTerm.trim())
          setSearchResults(result.items)
        } catch (error) {
          console.error("Error searching clients:", error)
          setSearchResults([])
        } finally {
          setIsSearchingClients(false)
        }
      } else {
        setSearchResults([])
      }
    }
    fetchClients()
  }, [debouncedSearchTerm])

  const handleClientSelect = (selectedClient: Client) => {
    setSelectedExistingClient(selectedClient)
    setClient({
      company: selectedClient.company || "",
      contactPerson: selectedClient.name || "",
      email: selectedClient.email || "",
      phone: selectedClient.phone || "",
      address: selectedClient.address || "",
      industry: selectedClient.industry || "",
      targetAudience: "",
      campaignObjective: "",
      id: selectedClient.id,
    })
    setSearchTerm("")
    setSearchResults([])
  }

  const proposalProducts: ProposalProduct[] = (selectedProducts || []).map((product) => ({
    id: product.id,
    name: product.name || "",
    type: product.type || "",
    price:
      typeof product.price === "number"
        ? product.price
        : typeof product.price === "string"
          ? Number.parseFloat(product.price) || 0
          : 0,
    location: product.specs_rental?.location || product.light?.location || "",
    site_code: product.site_code || "",
    media: product.media || [],
    specs_rental: product.specs_rental
      ? {
          location: product.specs_rental.location || "",
          traffic_count: product.specs_rental.traffic_count || 0,
          elevation: product.specs_rental.elevation || 0,
          height: product.specs_rental.height || 0,
          width: product.specs_rental.width || 0,
          audience_type: product.specs_rental.audience_type || "",
          audience_types: product.specs_rental.audience_types || [],
        }
      : null,
    light: product.light
      ? {
          location: product.light.location || "",
          name: product.light.name || "",
          operator: product.light.operator || "",
        }
      : null,
    description: product.description || "",
    health_percentage: product.health_percentage || 0,
  }))

  const totalAmount = proposalProducts.reduce((sum, product) => {
    const price = typeof product.price === "number" ? product.price : 0
    return sum + price
  }, 0)

  const handleCreateProposal = async () => {
    setIsCreating(true)
    setCreationStep("")

    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a proposal.",
        variant: "destructive",
      })
      setIsCreating(false)
      return
    }

    try {
      if (!title.trim()) {
        toast({
          title: "Missing title",
          description: "Please enter a proposal title.",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      if (proposalProducts.length === 0) {
        toast({
          title: "No products selected",
          description: "Please select at least one product for the proposal.",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      if (!startDate || !endDate) {
        toast({
          title: "Missing Dates",
          description: "Please select both a start and end date for the proposal.",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      if (startDate > endDate) {
        toast({
          title: "Invalid Dates",
          description: "Start date cannot be after end date.",
          variant: "destructive",
        })
        setIsCreating(false)
        return
      }

      let finalClientData: ProposalClient

      if (clientSelectionMode === "new") {
        if (!client.company.trim() || !client.contactPerson.trim() || !client.email.trim()) {
          toast({
            title: "Missing client information",
            description: "Please fill in the required client details.",
            variant: "destructive",
          })
          setIsCreating(false)
          return
        }
        setCreationStep("Creating new client record...")
        await new Promise((resolve) => setTimeout(resolve, 500))
        const newClientId = await createClient({
          name: client.contactPerson,
          email: client.email,
          phone: client.phone,
          company: client.company,
          address: client.address,
          city: "",
          state: "",
          zipCode: "",
          industry: client.industry,
          notes: "",
          status: "lead",
        })
        finalClientData = { ...client, id: newClientId }
      } else {
        if (!selectedExistingClient) {
          toast({
            title: "No client selected",
            description: "Please select an existing client.",
            variant: "destructive",
          })
          setIsCreating(false)
          return
        }
        finalClientData = {
          company: selectedExistingClient.company || "",
          contactPerson: selectedExistingClient.name || "",
          email: selectedExistingClient.email || "",
          phone: selectedExistingClient.phone || "",
          address: selectedExistingClient.address || "",
          industry: selectedExistingClient.industry || "",
          targetAudience: "",
          campaignObjective: "",
          id: selectedExistingClient.id,
        }
      }

      setCreationStep("Creating proposal document...")
      await new Promise((resolve) => setTimeout(resolve, 600))

      const proposalId = await createProposal(title.trim(), finalClientData, proposalProducts, user.uid, {
        notes: notes.trim(),
        customMessage: customMessage.trim(),
        validUntil,
        startDate,
        endDate,
      })

      setCreationStep("Finalizing...")
      await new Promise((resolve) => setTimeout(resolve, 300))

      toast({
        title: "Proposal Created!",
        description: "Your proposal has been successfully created.",
        variant: "success",
      })

      onProposalCreated()
      onClose()
      router.push(`/sales/proposals/${proposalId}`)
    } catch (error) {
      console.error("Error creating proposal:", error)
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
      setCreationStep("")
    }
  }

  const handleDownloadPDF = () => {
    toast({
      title: "PDF Download",
      description: "PDF generation will be implemented soon.",
    })
  }

  const resetForm = () => {
    setTitle("")
    setClient({
      company: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      industry: "",
      targetAudience: "",
      campaignObjective: "",
    })
    setValidUntil(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    setStartDate(undefined)
    setEndDate(undefined)
    setNotes("")
    setCustomMessage("")
    setStep("details")
    setCreationStep("")
    setClientSelectionMode("new")
    setSearchTerm("")
    setSearchResults([])
    setSelectedExistingClient(null)
    // Removed popover open state resets
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn("max-w-4xl overflow-visible")}>
        <DialogHeader>
          <DialogTitle>
            {step === "details" && "Create Proposal"}
            {step === "preview" && "Proposal Preview"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-150px)] pr-4">
          {step === "details" ? (
            <div className="space-y-6 pb-4">
              {/* Proposal Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Proposal Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter proposal title"
                />
              </div>

              {/* Client Information */}
              <Tabs
                value={clientSelectionMode}
                onValueChange={(value) => {
                  setClientSelectionMode(value as "new" | "existing")
                  setClient({
                    company: "",
                    contactPerson: "",
                    email: "",
                    phone: "",
                    address: "",
                    industry: "",
                    targetAudience: "",
                    campaignObjective: "",
                  })
                  setSelectedExistingClient(null)
                  setSearchTerm("")
                  setSearchResults([])
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new">New Client</TabsTrigger>
                  <TabsTrigger value="existing">Existing Client</TabsTrigger>
                </TabsList>
                <TabsContent value="new" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">New Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="company">Company Name *</Label>
                          <Input
                            id="company"
                            value={client.company}
                            onChange={(e) => setClient((prev) => ({ ...prev, company: e.target.value }))}
                            placeholder="Company name"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPerson">Contact Person *</Label>
                          <Input
                            id="contactPerson"
                            value={client.contactPerson}
                            onChange={(e) => setClient((prev) => ({ ...prev, contactPerson: e.target.value }))}
                            placeholder="Contact person name"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={client.email}
                            onChange={(e) => setClient((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="Email address"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={client.phone}
                            onChange={(e) => setClient((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="Phone number"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          value={client.address}
                          onChange={(e) => setClient((prev) => ({ ...prev, address: e.target.value }))}
                          placeholder="Company address"
                          disabled={clientSelectionMode === "existing"}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industry</Label>
                          <Input
                            id="industry"
                            value={client.industry}
                            onChange={(e) => setClient((prev) => ({ ...prev, industry: e.target.value }))}
                            placeholder="Industry type"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="targetAudience">Target Audience</Label>
                          <Input
                            id="targetAudience"
                            value={client.targetAudience}
                            onChange={(e) => setClient((prev) => ({ ...prev, targetAudience: e.target.value }))}
                            placeholder="Target audience"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="campaignObjective">Campaign Objective</Label>
                          <Input
                            id="campaignObjective"
                            value={client.campaignObjective}
                            onChange={(e) => setClient((prev) => ({ ...prev, campaignObjective: e.target.value }))}
                            placeholder="Campaign objective"
                            disabled={clientSelectionMode === "existing"}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="existing" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Select Existing Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="Search clients by name, email, company, or phone..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pr-10"
                        />
                        {isSearchingClients && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                        )}
                      </div>
                      {searchTerm.trim() && searchResults.length > 0 && (
                        <ScrollArea className="h-[200px] rounded-md border">
                          <div className="p-4">
                            {searchResults.map((result) => (
                              <div
                                key={result.id}
                                className="flex items-center justify-between py-2 px-3 hover:bg-gray-100 cursor-pointer rounded-md"
                                onClick={() => handleClientSelect(result)}
                              >
                                <div>
                                  <p className="font-medium">
                                    {result.name} ({result.company})
                                  </p>
                                  <p className="text-sm text-gray-500">{result.email}</p>
                                </div>
                                {selectedExistingClient?.id === result.id && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      {searchTerm.trim() && !isSearchingClients && searchResults.length === 0 && (
                        <p className="text-sm text-gray-500 text-center">No clients found matching your search.</p>
                      )}

                      {selectedExistingClient && (
                        <div className="space-y-2 mt-4 p-4 border rounded-md bg-gray-50">
                          <h4 className="font-semibold">Selected Client:</h4>
                          <p>
                            <strong>Company:</strong> {selectedExistingClient.company}
                          </p>
                          <p>
                            <strong>Contact:</strong> {selectedExistingClient.name}
                          </p>
                          <p>
                            <strong>Email:</strong> {selectedExistingClient.email}
                          </p>
                          {selectedExistingClient.phone && (
                            <p>
                              <strong>Phone:</strong> {selectedExistingClient.phone}
                            </p>
                          )}
                          {selectedExistingClient.address && (
                            <p>
                              <strong>Address:</strong> {selectedExistingClient.address}
                            </p>
                          )}
                          {selectedExistingClient.industry && (
                            <p>
                              <strong>Industry:</strong> {selectedExistingClient.industry}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Selected Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Products ({selectedProducts?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposalProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="h-16 w-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                          {product.media && product.media.length > 0 ? (
                            <Image
                              src={product.media[0].url || "/placeholder.svg"}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gray-100">
                              <MapPin size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">{product.location}</p>
                          {product.site_code && (
                            <Badge variant="outline" className="mt-1">
                              {product.site_code}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-700">₱{Number(product.price).toLocaleString()}</div>
                          <Badge variant="outline" className="mt-1">
                            {product.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-green-700">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={validUntil ? format(validUntil, "yyyy-MM-dd") : ""}
                    onChange={(e) => setValidUntil(e.target.value ? parseISO(e.target.value) : new Date())}
                    className="w-full"
                  />
                </div>
                {/* New Start Date Field */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setStartDate(e.target.value ? parseISO(e.target.value) : undefined)}
                    className="w-full"
                  />
                </div>
                {/* New End Date Field */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                    onChange={(e) => setEndDate(e.target.value ? parseISO(e.target.value) : undefined)}
                    className="w-full"
                    min={startDate ? format(startDate, "yyyy-MM-dd") : undefined} // Disable dates before start date
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Custom Message</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personalized message for the client"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add internal notes (not visible to client)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep("preview")} disabled={isCreating}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button onClick={handleCreateProposal} disabled={isCreating} className="min-w-[160px]">
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs">Creating...</span>
                          {creationStep && <span className="text-xs opacity-80">{creationStep}</span>}
                        </div>
                      </>
                    ) : (
                      "Create Proposal"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Preview Step
            <div className="space-y-6 pb-4">
              {/* Proposal Header */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-gray-600">Proposal for {client.company}</p>
                <p className="text-sm text-gray-500">Valid until {format(validUntil, "MMMM d, yyyy")}</p>
                {startDate && endDate && (
                  <p className="text-sm text-gray-500">
                    Campaign Period: {format(startDate, "MMM d, yyyy")} - {format(endDate, "MMM d, yyyy")}
                  </p>
                )}
              </div>

              {/* Client Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p>
                      <strong>Company:</strong> {client.company}
                    </p>
                    <p>
                      <strong>Contact:</strong> {client.contactPerson}
                    </p>
                    <p>
                      <strong>Email:</strong> {client.email}
                    </p>
                    {client.phone && (
                      <p>
                        <strong>Phone:</strong> {client.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    {client.address && (
                      <p>
                        <strong>Address:</strong> {client.address}
                      </p>
                    )}
                    {client.industry && (
                      <p>
                        <strong>Industry:</strong> {client.industry}
                      </p>
                    )}
                    {client.targetAudience && (
                      <p>
                        <strong>Target Audience:</strong> {client.targetAudience}
                      </p>
                    )}
                    {client.campaignObjective && (
                      <p>
                        <strong>Campaign Objective:</strong> {client.campaignObjective}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Message */}
              {customMessage && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="italic text-gray-700">"{customMessage}"</p>
                  </CardContent>
                </Card>
              )}

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Proposed Billboard Locations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {proposalProducts.map((product, index) => (
                      <div key={product.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex gap-4">
                          <div className="h-24 w-24 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            {product.media && product.media.length > 0 ? (
                              <Image
                                src={product.media[0].url || "/placeholder.svg"}
                                alt={product.name}
                                width={96}
                                height={96}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                <MapPin size={24} className="text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold">{product.name}</h4>
                            <p className="text-gray-600 flex items-center gap-1">
                              <MapPin size={14} />
                              {product.location}
                            </p>
                            {product.site_code && (
                              <p className="text-sm text-gray-500">Site Code: {product.site_code}</p>
                            )}
                            {product.specs_rental && (
                              <div className="mt-2 text-sm text-gray-600">
                                {product.specs_rental.traffic_count && (
                                  <p>Traffic Count: {product.specs_rental.traffic_count.toLocaleString()}/day</p>
                                )}
                                {product.specs_rental.height && product.specs_rental.width && (
                                  <p>
                                    Dimensions: {product.specs_rental.height}m × {product.specs_rental.width}m
                                  </p>
                                )}
                                {product.specs_rental.audience_type && (
                                  <p>Audience: {product.specs_rental.audience_type}</p>
                                )}
                              </div>
                            )}
                            {product.description && <p className="mt-2 text-sm text-gray-600">{product.description}</p>}
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-700">
                              ₱{Number(product.price).toLocaleString()}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              {product.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-6" />
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total Investment:</span>
                    <span className="text-green-700">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("details")} disabled={isCreating}>
                  Back to Edit
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleDownloadPDF} disabled={isCreating}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={handleCreateProposal} disabled={isCreating} className="min-w-[160px]">
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <div className="flex flex-col items-start">
                          <span className="text-xs">Creating...</span>
                          {creationStep && <span className="text-xs opacity-80">{creationStep}</span>}
                        </div>
                      </>
                    ) : (
                      "Create Proposal"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
