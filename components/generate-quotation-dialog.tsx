"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, MapPin, Loader2, Building, Mail, Phone } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { createQuotation, generateQuotationNumber, calculateQuotationTotal } from "@/lib/quotation-service"
import type { Proposal } from "@/lib/types/proposal"
import Image from "next/image"

interface GenerateQuotationDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
  onQuotationGenerated: (quotationId: string) => void
}

export function GenerateQuotationDialog({
  isOpen,
  onClose,
  proposal,
  onQuotationGenerated,
}: GenerateQuotationDialogProps) {
  const { toast } = useToast()

  // Form state
  const [selectedProductId, setSelectedProductId] = useState<string>(proposal.products[0]?.id || "")
  const [quotationNumber] = useState(generateQuotationNumber())
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date()
    date.setDate(date.getDate() + 30) // Default 30 days
    return date
  })
  const [customPrice, setCustomPrice] = useState<string>("")
  const [notes, setNotes] = useState(proposal.notes || "")
  const [isGenerating, setIsGenerating] = useState(false)

  // Get selected product
  const selectedProduct = proposal.products.find((p) => p.id === selectedProductId)

  // Calculate pricing
  const basePrice = selectedProduct ? selectedProduct.price : 0
  const finalPrice = customPrice ? Number.parseFloat(customPrice) || basePrice : basePrice
  const { durationDays, totalAmount } = calculateQuotationTotal(
    startDate.toISOString().split("T")[0],
    endDate.toISOString().split("T")[0],
    finalPrice,
  )

  const handleGenerateQuotation = async () => {
    if (!selectedProduct) {
      toast({
        title: "No product selected",
        description: "Please select a product for the quotation.",
        variant: "destructive",
      })
      return
    }

    if (!startDate || !endDate) {
      toast({
        title: "Missing dates",
        description: "Please select both start and end dates.",
        variant: "destructive",
      })
      return
    }

    if (endDate <= startDate) {
      toast({
        title: "Invalid date range",
        description: "End date must be after start date.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const quotationData = {
        quotation_number: quotationNumber,
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        product_location: selectedProduct.location,
        site_code: selectedProduct.site_code || "",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        price: finalPrice,
        total_amount: totalAmount,
        duration_days: durationDays,
        notes: notes.trim(),
        status: "draft" as const,
        created_by: "current_user",
        client_name: proposal.client.contactPerson,
        client_email: proposal.client.email,
      }

      const quotationId = await createQuotation(quotationData)

      toast({
        title: "Quotation Generated Successfully!",
        description: `Quotation ${quotationNumber} has been created and is ready to be sent to the client.`,
      })

      onQuotationGenerated(quotationId)
      handleClose()
    } catch (error) {
      console.error("Error generating quotation:", error)
      toast({
        title: "Error",
        description: "Failed to generate quotation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setSelectedProductId(proposal.products[0]?.id || "")
    setStartDate(new Date())
    const defaultEndDate = new Date()
    defaultEndDate.setDate(defaultEndDate.getDate() + 30)
    setEndDate(defaultEndDate)
    setCustomPrice("")
    setNotes(proposal.notes || "")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Quotation from Proposal</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Proposal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proposal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Proposal Title</Label>
                  <p className="text-base font-semibold">{proposal.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Quotation Number</Label>
                  <p className="text-base font-mono">{quotationNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Company</Label>
                    <p className="text-base">{proposal.client.company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contact</Label>
                    <p className="text-base">{proposal.client.contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-base">{proposal.client.email}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Product</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {proposal.products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-sm text-gray-500">- {product.location}</span>
                          <Badge variant="outline" className="text-xs">
                            ₱{product.price.toLocaleString()}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Product Details */}
              {selectedProduct && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {selectedProduct.media && selectedProduct.media.length > 0 ? (
                        <Image
                          src={selectedProduct.media[0].url || "/placeholder.svg"}
                          alt={selectedProduct.name}
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
                      <h4 className="font-medium">{selectedProduct.name}</h4>
                      <p className="text-sm text-gray-600">{selectedProduct.location}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{selectedProduct.type}</Badge>
                        {selectedProduct.site_code && <Badge variant="outline">{selectedProduct.site_code}</Badge>}
                      </div>
                      {selectedProduct.specs_rental && (
                        <div className="mt-2 text-xs text-gray-600">
                          {selectedProduct.specs_rental.traffic_count && (
                            <span>Traffic: {selectedProduct.specs_rental.traffic_count.toLocaleString()}/day • </span>
                          )}
                          {selectedProduct.specs_rental.height && selectedProduct.specs_rental.width && (
                            <span>
                              Size: {selectedProduct.specs_rental.height}m × {selectedProduct.specs_rental.width}m
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">₱{selectedProduct.price.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">per day</div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rental Period & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rental Period & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customPrice">Custom Price per Day (Optional)</Label>
                  <Input
                    id="customPrice"
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder={`Default: ₱${basePrice.toLocaleString()}`}
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to use the original price of ₱{basePrice.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500">Duration</Label>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-lg font-semibold">{durationDays} days</p>
                    <p className="text-sm text-gray-600">
                      {startDate && endDate && format(startDate, "MMM d")} - {endDate && format(endDate, "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Price per day:</span>
                    <span>₱{finalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration:</span>
                    <span>{durationDays} days</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-700">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes or terms for this quotation"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button onClick={handleGenerateQuotation} disabled={isGenerating} className="min-w-[160px]">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Quotation"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
