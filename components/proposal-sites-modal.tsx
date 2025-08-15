"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { X, Copy, Check } from "lucide-react"
import { format } from "date-fns"
import type { Proposal } from "@/lib/types/proposal"
import { toast } from "sonner"

interface ProposalSitesModalProps {
  proposal: Proposal | null
  isOpen: boolean
  onClose: () => void
}

export function ProposalSitesModal({ proposal, isOpen, onClose }: ProposalSitesModalProps) {
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [copied, setCopied] = useState(false)

  if (!proposal) return null

  const handleSiteToggle = (siteId: string) => {
    setSelectedSites((prev) => (prev.includes(siteId) ? prev.filter((id) => id !== siteId) : [...prev, siteId]))
  }

  const handleSelectAll = () => {
    if (selectedSites.length === proposal.products.length) {
      setSelectedSites([])
    } else {
      setSelectedSites(proposal.products.map((product) => product.id))
    }
  }

  const handleCopySites = async () => {
    if (selectedSites.length === 0) {
      toast.error("Please select at least one site to copy")
      return
    }

    const selectedProducts = proposal.products.filter((product) => selectedSites.includes(product.id))

    const siteData = selectedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      location: product.location,
      site_code: product.site_code,
      type: product.type,
      price: product.price,
    }))

    try {
      await navigator.clipboard.writeText(JSON.stringify(siteData, null, 2))
      setCopied(true)
      toast.success(`${selectedSites.length} sites copied to clipboard`)

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy sites:", error)
      toast.error("Failed to copy sites")
    }
  }

  const handleClose = () => {
    setSelectedSites([])
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <DialogTitle className="text-xl font-semibold">{proposal.proposalNumber || proposal.title}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">Sent on {format(proposal.createdAt, "MMM d, yyyy")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
            >
              {selectedSites.length === proposal.products.length ? "Deselect All" : "Select All"}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {proposal.products.map((product) => (
              <div
                key={product.id}
                className={`relative border rounded-lg p-3 cursor-pointer transition-all ${
                  selectedSites.includes(product.id)
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleSiteToggle(product.id)}
              >
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedSites.includes(product.id)}
                    onChange={() => handleSiteToggle(product.id)}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                </div>

                {/* Site Image */}
                <div className="aspect-video bg-gray-100 rounded-md mb-3 overflow-hidden">
                  {product.media && product.media.length > 0 ? (
                    <img
                      src={product.media[0].url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs">No Image</span>
                    </div>
                  )}
                </div>

                {/* Site Info */}
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 font-medium">{product.site_code || product.id}</div>
                  <div className="font-medium text-sm line-clamp-2">{product.name}</div>
                  <div className="text-xs text-gray-600 line-clamp-1">{product.location}</div>
                  {product.specs_rental?.audience_type && (
                    <Badge variant="secondary" className="text-xs">
                      {product.specs_rental.audience_type}
                    </Badge>
                  )}
                </div>

                {/* Selection Indicator */}
                {selectedSites.includes(product.id) && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-green-600 rounded-full p-1">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-500">
            {selectedSites.length} of {proposal.products.length} sites selected
          </div>
          <Button
            onClick={handleCopySites}
            disabled={selectedSites.length === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Copy className="h-4 w-4 mr-2" />
            {copied ? "Copied!" : "Copy Sites"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
