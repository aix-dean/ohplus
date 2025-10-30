"use client"

import React, { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { createDirectCostEstimate } from "@/lib/cost-estimate-service"
import { createDirectQuotation } from "@/lib/quotation-service"
import { useRouter } from "next/navigation"
import { SpotsGrid } from "./spots-grid"
import { useDebounce } from "@/hooks/use-debounce"
import { getPaginatedClients, type Client } from "@/lib/client-service"
import { PlusCircle, CheckCircle, Loader2, ChevronDown, Search } from "lucide-react"
import { ClientDialog } from "./client-dialog"
import { cn } from "@/lib/utils"

interface Spot {
  id: string
  number: number
  status: "occupied" | "vacant"
  clientName?: string
  imageUrl?: string
}

interface ProductSpotsData {
  spots: Spot[]
  totalSpots: number
  occupiedCount: number
  vacantCount: number
  currentDate: string
}

interface SpotSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  products: any[]
  spotsData: Record<string, ProductSpotsData>
  currentDate: string
  selectedDate: string
  type: "quotation" | "cost-estimate"
  preSelectedClient?: any
  nonDynamicSites?: any[]
  showDoneButton?: boolean
  onDone?: (selectedSpots: Record<string, number[]>) => void
  hideClientSelection?: boolean
}

export function SpotSelectionDialog({
  open,
  onOpenChange,
  products,
  spotsData,
  currentDate,
  selectedDate,
  type,
  preSelectedClient,
  nonDynamicSites = [],
  showDoneButton = false,
  onDone,
  hideClientSelection = false,
}: SpotSelectionDialogProps) {
  const [selectedSpots, setSelectedSpots] = useState<Record<string, number[]>>({})
  const [loading, setLoading] = useState(false)
  const { userData } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Client Search/Selection state
  const [dashboardClientSearchTerm, setDashboardClientSearchTerm] = useState("")
  const [dashboardClientSearchResults, setDashboardClientSearchResults] = useState<Client[]>([])
  const [isSearchingDashboardClients, setIsSearchingDashboardClients] = useState(false)
  const debouncedDashboardClientSearchTerm = useDebounce(dashboardClientSearchTerm, 500)
  const clientSearchRef = useRef<HTMLDivElement>(null)
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [isNewClientDialogOpen, setIsNewClientDialogOpen] = useState(false)
  const [selectedClientForProposal, setSelectedClientForProposal] = useState<any>(preSelectedClient || null)

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedSpots({})
      if (!preSelectedClient) {
        setSelectedClientForProposal(null)
        setDashboardClientSearchTerm("")
      } else {
        setSelectedClientForProposal(preSelectedClient)
        setDashboardClientSearchTerm(preSelectedClient.company || preSelectedClient.contactPerson || "")
      }
    }
  }, [open, preSelectedClient])

  // Fetch clients for dashboard client selection
  useEffect(() => {
    const fetchClients = async () => {
      if (userData?.company_id && open) {
        setIsSearchingDashboardClients(true)
        try {
          const itemsPerPage = debouncedDashboardClientSearchTerm.trim() ? 10000 : 100
          const result = await getPaginatedClients(itemsPerPage, null, debouncedDashboardClientSearchTerm.trim(), null, null, userData.company_id, false)
          setDashboardClientSearchResults(result.items)
        } catch (error) {
          console.error("Error fetching clients for dialog:", error)
          setDashboardClientSearchResults([])
        } finally {
          setIsSearchingDashboardClients(false)
        }
      } else {
        setDashboardClientSearchResults([])
      }
    }
    fetchClients()
  }, [debouncedDashboardClientSearchTerm, userData?.company_id, open])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleClientSelectOnDashboard = (client: Client) => {
    setSelectedClientForProposal({
      id: client.id,
      company: client.company || "",
      contactPerson: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      industry: client.industry || "",
      designation: client.designation || "",
      targetAudience: "",
      campaignObjective: "",
      company_id: client.company_id || "",
    })
    setDashboardClientSearchTerm(client.company || client.name || "")
    toast({
      title: "Client Selected",
      description: `Selected ${client.name} (${client.company}).`,
    })
    setIsClientDropdownOpen(false)
  }

  const handleSpotToggle = (productId: string, spotNumber: number) => {
    setSelectedSpots(prev => {
      const productSpots = prev[productId] || []
      const newProductSpots = productSpots.includes(spotNumber)
        ? productSpots.filter(num => num !== spotNumber)
        : [...productSpots, spotNumber]

      return {
        ...prev,
        [productId]: newProductSpots
      }
    })
  }

  const handleDone = () => {
    if (onDone) {
      onDone(selectedSpots)
    }
    onOpenChange(false)
  }

  const handleCreate = async () => {
    const totalSelectedSpots = Object.values(selectedSpots).reduce((total, spots) => total + spots.length, 0)

    if (totalSelectedSpots === 0) {
      toast({
        title: "Error",
        description: "Please select at least one spot",
        variant: "destructive",
      })
      return
    }

    if (!selectedClientForProposal) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      })
      return
    }

    if (!userData) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      })
      return
    }

    // Navigate to select-dates page with selected spots for all products, non-dynamic sites, and client
    const allSpotSelections = Object.entries(selectedSpots).map(([productId, spots]) => ({
      productId,
      spotNumbers: spots
    }))

    const params = new URLSearchParams({
      spotSelections: JSON.stringify(allSpotSelections),
      sites: JSON.stringify(nonDynamicSites.map(site => site.id)),
      clientId: selectedClientForProposal.id,
    })

    const path = type === "cost-estimate"
      ? `/sales/cost-estimates/select-dates?${params.toString()}`
      : `/sales/quotations/select-dates?${params.toString()}`

    router.push(path)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden pr-4">
        <DialogHeader>
          <DialogTitle>
            Select Spot/s for {type === "cost-estimate" ? "Cost Estimate" : "Quotation"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full max-h-[calc(90vh-8rem)] max-w-3xl pr-12">
          {/* Client Selection - Only show when not hidden */}
          {!hideClientSelection && (
            <div className="mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Select Client</label>
                <div className="relative" ref={clientSearchRef}>
                  <Input
                    placeholder="Choose a client..."
                    value={
                      selectedClientForProposal
                        ? selectedClientForProposal.company || selectedClientForProposal.contactPerson
                        : dashboardClientSearchTerm
                    }
                    onChange={(e) => {
                      setDashboardClientSearchTerm(e.target.value)
                      setSelectedClientForProposal(null)
                    }}
                    onClick={() => {
                      setIsClientDropdownOpen(true)
                      if (selectedClientForProposal) {
                        setDashboardClientSearchTerm("")
                      }
                    }}
                    className={cn(
                      "h-11 pl-4 pr-10 text-sm border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all",
                      selectedClientForProposal && "border-green-500 bg-green-50",
                    )}
                  />
                  {isSearchingDashboardClients ? (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-500" />
                  ) : (
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  )}
                  {/* Results dropdown */}
                  {isClientDropdownOpen && (
                    <Card className="absolute top-full z-50 mt-2 w-full shadow-xl border border-gray-200 rounded-lg animate-in slide-in-from-top-2 duration-200">
                      <div className="max-h-60 overflow-y-auto">
                        <div className="p-2">
                          {/* Always show "Add New Client" option at the top */}
                          <div
                            className="flex items-center gap-3 py-3 px-3 hover:bg-blue-50 cursor-pointer rounded-md text-sm mb-2 border-b border-gray-100 transition-colors"
                            onClick={() => setIsNewClientDialogOpen(true)}
                          >
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                              <PlusCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-blue-700">Add New Client</span>
                          </div>

                          {dashboardClientSearchResults.length > 0 ? (
                            dashboardClientSearchResults.map((result) => (
                              <div
                                key={result.id}
                                className="flex items-center justify-between py-3 px-3 hover:bg-gray-50 cursor-pointer rounded-md text-sm transition-colors"
                                onClick={() => handleClientSelectOnDashboard(result)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                                    <span className="text-xs font-medium text-gray-600">
                                      {(result.company || result.name).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {result.name} {result.company && `(${result.company})`}
                                    </p>
                                    <p className="text-xs text-gray-500">{result.email}</p>
                                  </div>
                                </div>
                                {selectedClientForProposal?.id === result.id && (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6">
                              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">
                                {dashboardClientSearchTerm.trim() && !isSearchingDashboardClients
                                  ? `No clients found for "${dashboardClientSearchTerm}".`
                                  : "Start typing to search for clients."}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Spots Grid with Selection */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {products.map((product) => {
                const productSpotsData = spotsData[product.id]
                if (!productSpotsData) return null

                const { spots, totalSpots, occupiedCount, vacantCount, currentDate } = productSpotsData
                const productSelectedSpots = selectedSpots[product.id] || []

                return (
                  <div key={product.id} className="bg-[#ECECEC] rounded-[13.8px] p-4 space-y-4">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <SpotsGrid
                      spots={spots}
                      totalSpots={totalSpots}
                      occupiedCount={occupiedCount}
                      vacantCount={vacantCount}
                      currentDate={currentDate}
                      selectedSpots={productSelectedSpots}
                      onSpotToggle={(spotNumber) => handleSpotToggle(product.id, spotNumber)}
                      showSummary={false}
                      bg={false}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {showDoneButton ? (
              <Button
                onClick={handleDone}
                disabled={Object.values(selectedSpots).every(spots => spots.length === 0)}
              >
                Done
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={loading || Object.values(selectedSpots).every(spots => spots.length === 0) || !selectedClientForProposal}
              >
                {loading ? "Creating..." : `Create ${type === "cost-estimate" ? "Cost Estimate" : "Quotation"}`}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>

      {/* New Client Dialog */}
      <ClientDialog
        open={isNewClientDialogOpen}
        onOpenChange={setIsNewClientDialogOpen}
        onSuccess={(newClient) => {
          setIsNewClientDialogOpen(false)
          handleClientSelectOnDashboard(newClient)
          toast({
            title: "Client Added",
            description: `${newClient.name} (${newClient.company}) has been added.`,
          })
        }}
      />
    </Dialog>
  )
}
