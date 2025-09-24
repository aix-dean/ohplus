"use client"

import { Search, Grid3X3, List, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { RouteProtection } from "@/components/route-protection"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"
import type { Collectible } from "@/lib/types/collectible"

function CollectiblesTable({
  collectibles,
  loading,
  onClientClick,
  onViewContract,
  onGenerateInvoice,
  selectedCollectible,
  isModalOpen,
  setIsModalOpen,
  formatDate
}: {
  collectibles: Collectible[]
  loading: boolean
  onClientClick: (collectible: Collectible) => void
  onViewContract: (item: any) => void
  onGenerateInvoice: (item: any) => void
  selectedCollectible: Collectible | null
  isModalOpen: boolean
  setIsModalOpen: (open: boolean) => void
  formatDate: (timestamp: any) => string
}) {
  // Calculate client data from selectedCollectible
  const selectedClientData = selectedCollectible ? (() => {
    let duration = "N/A"
    if (selectedCollectible.booking?.start_date && selectedCollectible.booking?.end_date) {
      const startDate = selectedCollectible.booking.start_date.toDate ? selectedCollectible.booking.start_date.toDate() : new Date(selectedCollectible.booking.start_date)
      const endDate = selectedCollectible.booking.end_date.toDate ? selectedCollectible.booking.end_date.toDate() : new Date(selectedCollectible.booking.end_date)
      const months = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      duration = `${months} month${months !== 1 ? 's' : ''}`
    }

    return {
      reservationId: selectedCollectible.booking?.reservation_id || "N/A",
      projectName: selectedCollectible.booking?.project_name || "N/A",
      client: selectedCollectible.client?.name || "N/A",
      site: selectedCollectible.product?.name || "N/A",
      dimension: "N/A", // Not in collectible
      contractDuration: duration,
      bookingDates: selectedCollectible.booking?.start_date && selectedCollectible.booking?.end_date ?
        `${formatDate(selectedCollectible.booking.start_date)} to ${formatDate(selectedCollectible.booking.end_date)}` : "N/A",
      illumination: "N/A",
      leaseRatePerMonth: selectedCollectible.rate?.toLocaleString() || "N/A",
      totalLease: selectedCollectible.rate && selectedCollectible.total_months ? (selectedCollectible.rate * selectedCollectible.total_months).toLocaleString() : "N/A",
      subtotal: selectedCollectible.rate && selectedCollectible.total_months ? (selectedCollectible.rate * selectedCollectible.total_months).toLocaleString() : "N/A",
      vat: selectedCollectible.vat_amount?.toLocaleString() || "N/A",
      total: selectedCollectible.amount && selectedCollectible.vat_amount ? (selectedCollectible.amount + selectedCollectible.vat_amount).toLocaleString() : "N/A",
      sales: "N/A",
    }
  })() : null
  console.log(`collectibles:`, selectedClientData)
  return (
    <div className="bg-[#ffffff] rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-[#d9d9d9]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-[#333333]">Collectibles</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-[#b7b7b7]">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-[#b7b7b7]">
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#b7b7b7]" />
          <Input
            placeholder="Search"
            className="pl-10 bg-[#fafafa] border-[#d9d9d9] text-[#333333] placeholder:text-[#b7b7b7]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#d9d9d9]">
              <th className="text-left p-4 font-medium text-[#333333]">Sales Invoice #</th>
              <th className="text-left p-4 font-medium text-[#333333]">Client</th>
              <th className="text-left p-4 font-medium text-[#333333]">Cover Dates</th>
              <th className="text-left p-4 font-medium text-[#333333]">Amount</th>
              <th className="text-left p-4 font-medium text-[#333333]">Due date</th>
              <th className="text-left p-4 font-medium text-[#333333]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[#b7b7b7]">Loading collectibles...</td>
              </tr>
            ) : collectibles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-[#b7b7b7]">No collectibles found</td>
              </tr>
            ) : (
              collectibles.map((item, index) => (
                <tr key={item.id || index} className="border-b border-[#d9d9d9] hover:bg-[#fafafa]">
                  <td className="p-4">
                    <span className="text-[#2d3fff] underline cursor-pointer">{item.id?.slice(-4) || "-"}</span>
                  </td>
                  <td className="p-4">
                    <span
                      className="bg-[#d9d9d9] px-3 py-1 rounded-full text-sm text-[#333333] cursor-pointer hover:bg-[#c4c4c4] transition-colors"
                      onClick={() => onClientClick(item)}
                    >
                      {item.client?.name || "N/A"}
                    </span>
                  </td>
                  <td className="p-4 text-[#333333]">{item.period || "N/A"}</td>
                  <td className="p-4">
                    <span className="text-[#2d3fff] font-medium">{item.amount?.toLocaleString() || "N/A"}</span>
                  </td>
                  <td className="p-4 text-[#333333]">{item.due_date ? formatDate(item.due_date) : "N/A"}</td>
                  <td className="p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#b7b7b7] hover:text-[#333333] hover:bg-[#fafafa] p-1 h-8 w-8"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-[#d9d9d9] shadow-lg">
                        <DropdownMenuItem
                          // onClick={() => handleViewContract(item)}
                          className="text-[#333333] hover:bg-[#fafafa] cursor-pointer px-3 py-2"
                        >
                          View Contract
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          // onClick={() => handleGenerateInvoice(item)}
                          className="text-[#333333] hover:bg-[#fafafa] cursor-pointer px-3 py-2"
                        >
                          Generate Invoice
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Reservation Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto bg-white p-6">
          {selectedClientData && (
            
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-[#b7b7b7] mb-1">Reservation ID</p>
                <h2 className="text-3xl font-bold text-[#000000]">{selectedClientData.reservationId}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Project Name:</span>
                  <span className="text-[#333333]">{selectedClientData.projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Client:</span>
                  <span className="text-[#333333]">{selectedClientData.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Site:</span>
                  <span className="text-[#333333]">{selectedClientData.site}</span>
                </div>
              </div>

              <div className="flex justify-center my-6">
                <div className="w-24 h-24 bg-[#d9d9d9] rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#000000]">Site</p>
                    <p className="text-sm font-medium text-[#000000]">Photo</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Dimension:</span>
                  <span className="text-[#333333]">{selectedClientData.dimension}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Contract Duration:</span>
                  <span className="text-[#333333]">{selectedClientData.contractDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Booking Dates:</span>
                  <span className="text-[#333333]">{selectedClientData.bookingDates}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Illumination:</span>
                  <span className="text-[#333333]">{selectedClientData.illumination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Lease Rate/month:</span>
                  <span className="text-[#333333]">{selectedClientData.leaseRatePerMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Total lease:</span>
                  <span className="text-[#333333]">{selectedClientData.totalLease}</span>
                </div>
              </div>

              <div className="border-t border-[#d9d9d9] pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Lease rate per month:</span>
                  <span className="text-[#333333]">{selectedClientData.leaseRatePerMonth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Duration:</span>
                  <span className="text-[#333333]">{selectedClientData.contractDuration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">Subtotal:</span>
                  <span className="text-[#333333]">{selectedClientData.subtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-[#000000]">12% VAT:</span>
                  <span className="text-[#333333]">{selectedClientData.vat}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-[#000000]">TOTAL:</span>
                  <span className="text-[#000000]">{selectedClientData.total}</span>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <span className="font-medium text-[#000000]">Sales:</span>
                <span className="text-[#333333]">{selectedClientData.sales}</span>
              </div>

              <div className="pt-6">
                <Button
                  onClick={() => setIsModalOpen(false)}
                  className="w-full bg-white border border-[#d9d9d9] text-[#000000] hover:bg-[#fafafa]"
                >
                  OK
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CollectiblesPage() {
  const { userData } = useAuth()
  const [collectibles, setCollectibles] = useState<Collectible[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCollectible, setSelectedCollectible] = useState<Collectible | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Fetch collectibles data
  const fetchCollectibles = async () => {
    if (!userData?.company_id) return

    setLoading(true)
    try {
      const collectiblesRef = collection(db, "collectibles")
      const q = query(
        collectiblesRef,
        where("company_id", "==", userData.company_id),
        orderBy("created", "desc")
      )

      const querySnapshot = await getDocs(q)
      const collectiblesData: Collectible[] = []

      querySnapshot.forEach((doc) => {
        collectiblesData.push({
          id: doc.id,
          ...doc.data(),
        } as Collectible)
      })

      setCollectibles(collectiblesData)
    } catch (error) {
      console.error("Error fetching collectibles:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCollectibles()
  }, [userData?.company_id])

  // Format date helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleClientClick = (collectible: Collectible) => {
    setSelectedCollectible(collectible)
    setIsModalOpen(true)
  }

  const handleViewContract = (item: any) => {
    console.log("View Contract for:", item.client, item.invoiceNumber)
    // Add your view contract logic here
  }

  const handleGenerateInvoice = (item: any) => {
    console.log("Generate Invoice for:", item.client, item.invoiceNumber)
    // Add your generate invoice logic here
  }

  return (
    <RouteProtection requiredRoles="treasury">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <CollectiblesTable
          collectibles={collectibles}
          loading={loading}
          onClientClick={handleClientClick}
          onViewContract={handleViewContract}
          onGenerateInvoice={handleGenerateInvoice}
          selectedCollectible={selectedCollectible}
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          formatDate={formatDate}
        />
      </div>
    </RouteProtection>
  )
}
