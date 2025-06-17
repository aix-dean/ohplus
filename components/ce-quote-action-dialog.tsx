"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MapPin, Loader2, CheckCircle, Calculator, FileText } from "lucide-react" // Removed CalendarIcon
import { format, parseISO } from "date-fns" // Added parseISO
import type { Product } from "@/lib/firebase-service"
import Image from "next/image"
import { useDebounce } from "@/hooks/use-debounce"
import { getPaginatedClients, createClient, type Client } from "@/lib/client-service"
import { createDirectCostEstimate } from "@/lib/cost-estimate-service"

interface CeQuoteActionDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedSites: Product[]
  onActionCompleted: () => void
}

interface ClientData {
  company: string
  contactPerson: string
  email: string
  phone: string
  address: string
  industry: string
  id?: string
}

export function CeQuoteActionDialog({ isOpen, onClose, selectedSites, onActionCompleted }: CeQuoteActionDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Client selection state
  const [clientSelectionMode, setClientSelectionMode] = useState<"new" | "existing">("existing")
  const [client, setClient] = useState<ClientData>({
    company: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    industry: "",
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Client[]>([])
  const [isSearchingClients, setIsSearchingClients] = useState(false)
  const [selectedExistingClient, setSelectedExistingClient] = useState<Client | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // New states for start and end dates
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  // Removed popover open states

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

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
      id: selectedClient.id,
    })
    setSearchTerm("")
    setSearchResults([])
  }

  const totalAmount = selectedSites.reduce((sum, site) => {
    const price = typeof site.price === "number" ? site.price : 0
    return sum + price
  }, 0)

  const handleCreateCostEstimate = async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      let finalClientData: ClientData

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
        finalClientData = client
      }

      if (!startDate || !endDate) {
        toast({
          title: "Missing Dates",
          description: "Please select both a start and end date for the cost estimate.",
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

      const sitesData = selectedSites.map((site) => ({
        id: site.id,
        name: site.name || "Unknown Site",
        location: site.specs_rental?.location || site.light?.location || "Unknown location",
        price: Number(site.price || 0),
        type: site.type || "billboard",
      }))

      const costEstimateId = await createDirectCostEstimate(
        {
          id: finalClientData.id || "",
          name: finalClientData.contactPerson,
          email: finalClientData.email,
          company: finalClientData.company,
          phone: finalClientData.phone,
          address: finalClientData.address,
        },
        sitesData,
        user.uid,
        {
          notes: `Cost estimate created from selected sites for ${finalClientData.company}`,
          sendEmail: false,
          startDate,
          endDate,
        },
      )

      router.push(`/sales/cost-estimates/${costEstimateId}`)

      onActionCompleted()
      onClose()

      toast({
        title: "Cost Estimate Created",
        description: "Cost estimate has been created successfully.",
      })
    } catch (error) {
      console.error("Error creating cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to create cost estimate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateQuotation = async () => {
    if (!user?.uid) {
      toast({
        title: "Authentication Required",
        description: "Please log in to continue.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      let finalClientData: ClientData

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
        finalClientData = client
      }

      if (!startDate || !endDate) {
        toast({
          title: "Missing Dates",
          description: "Please select both a start and end date for the quotation.",
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

      const siteIds = selectedSites.map((site) => site.id).join(",")
      const clientParam = finalClientData.id ? `&clientId=${finalClientData.id}` : ""
      const datesParam = `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      router.push(`/sales/quotations/create?sites=${siteIds}${clientParam}${datesParam}`)

      onActionCompleted()
    } catch (error) {
      console.error("Error preparing quotation:", error)
      toast({
        title: "Error",
        description: "Failed to prepare quotation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setClient({
      company: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      industry: "",
    })
    setClientSelectionMode("existing")
    setSearchTerm("")
    setSearchResults([])
    setSelectedExistingClient(null)
    setStartDate(undefined)
    setEndDate(undefined)
    // Removed popover open state resets
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl overflow-visible">
        <DialogHeader>
          <DialogTitle>Create Cost Estimate or Quotation</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[calc(90vh-150px)] pr-4">
          <div className="space-y-6 pb-4">
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
                })
                setSelectedExistingClient(null)
                setSearchTerm("")
                setSearchResults([])
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Existing Client</TabsTrigger>
                <TabsTrigger value="new">New Client</TabsTrigger>
              </TabsList>

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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson">Contact Person *</Label>
                        <Input
                          id="contactPerson"
                          value={client.contactPerson}
                          onChange={(e) => setClient((prev) => ({ ...prev, contactPerson: e.target.value }))}
                          placeholder="Contact person name"
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={client.phone}
                          onChange={(e) => setClient((prev) => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
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
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Input
                        id="industry"
                        value={client.industry}
                        onChange={(e) => setClient((prev) => ({ ...prev, industry: e.target.value }))}
                        placeholder="Industry type"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* New Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Selected Sites */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selected Sites ({selectedSites.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedSites.map((site) => (
                    <div key={site.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="h-16 w-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                        {site.media && site.media.length > 0 ? (
                          <Image
                            src={site.media[0].url || "/placeholder.svg"}
                            alt={site.name}
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
                        <h4 className="font-medium">{site.name}</h4>
                        <p className="text-sm text-gray-500">
                          {site.specs_rental?.location || site.light?.location || "Unknown location"}
                        </p>
                        {site.site_code && (
                          <Badge variant="outline" className="mt-1">
                            {site.site_code}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-green-700">₱{Number(site.price || 0).toLocaleString()}</div>
                        <Badge variant="outline" className="mt-1">
                          {site.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Estimated Value:</span>
                  <span className="text-green-700">₱{totalAmount.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateCostEstimate}
                  disabled={
                    isCreating ||
                    !startDate ||
                    !endDate ||
                    (clientSelectionMode === "existing" && !selectedExistingClient) ||
                    (clientSelectionMode === "new" &&
                      (!client.company.trim() || !client.contactPerson.trim() || !client.email.trim()))
                  }
                  className="gap-2"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  Create Cost Estimate
                </Button>
                <Button
                  onClick={handleCreateQuotation}
                  disabled={
                    isCreating ||
                    !startDate ||
                    !endDate ||
                    (clientSelectionMode === "existing" && !selectedExistingClient) ||
                    (clientSelectionMode === "new" &&
                      (!client.company.trim() || !client.contactPerson.trim() || !client.email.trim()))
                  }
                  variant="outline"
                  className="gap-2"
                >
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Create Quotation
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
