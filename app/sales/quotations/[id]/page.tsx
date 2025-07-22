"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, CalendarIcon, FileText, Loader2, Save, Send, Download, Edit } from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import {
  getQuotationById,
  updateQuotation,
  calculateQuotationTotal,
  generateQuotationPDF,
} from "@/lib/quotation-service"
import type { Quotation } from "@/lib/types/quotation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

// Helper to safely convert various date inputs to a Date object
const getDateObject = (date: any): Date | undefined => {
  if (date instanceof Date) {
    return date
  }
  if (typeof date === "string") {
    const parsedDate = parseISO(date)
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate
    }
  }
  if (date && typeof date.toDate === "function") {
    // Firebase Timestamp
    return date.toDate()
  }
  console.warn("Could not convert to Date object:", date)
  return undefined
}

export default function QuotationDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user, userData } = useAuth()

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editableQuotation, setEditableQuotation] = useState<Quotation | null>(null)

  const fetchQuotation = useCallback(async () => {
    if (params.id) {
      try {
        setLoading(true)
        const quotationData = await getQuotationById(params.id as string)
        if (quotationData) {
          setQuotation(quotationData)
          setEditableQuotation(quotationData) // Initialize editable state
        } else {
          toast({
            title: "Not Found",
            description: "Quotation not found.",
            variant: "destructive",
          })
          router.push("/sales/quotations-list")
        }
      } catch (error) {
        console.error("Error fetching quotation:", error)
        toast({
          title: "Error",
          description: "Failed to load quotation details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
  }, [params.id, router, toast])

  useEffect(() => {
    fetchQuotation()
  }, [fetchQuotation])

  // Effect to recalculate total amount whenever relevant fields change in editableQuotation
  useEffect(() => {
    if (editableQuotation && editableQuotation.products && editableQuotation.start_date && editableQuotation.end_date) {
      const { durationDays, totalAmount } = calculateQuotationTotal(
        editableQuotation.start_date,
        editableQuotation.end_date,
        editableQuotation.products,
      )

      setEditableQuotation((prev) => {
        if (prev) {
          return {
            ...prev,
            duration_days: durationDays,
            total_amount: totalAmount,
          }
        }
        return null
      })
    }
  }, [editableQuotation]) // Updated to use the entire editableQuotation object

  const handleEditClick = () => {
    setIsEditing(true)
    setEditableQuotation(quotation) // Reset editable state to current quotation data
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditableQuotation(quotation) // Revert changes
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditableQuotation((prev) => {
      if (!prev) return null
      if (name === "price") {
        // Update price for all products if it's a single price input
        const updatedProducts = prev.products.map((p) => ({ ...p, price: Number.parseFloat(value) || 0 }))
        return { ...prev, products: updatedProducts }
      }
      return { ...prev, [name]: value }
    })
  }

  const handleDateChange = (date: Date | undefined, field: "start_date" | "end_date") => {
    setEditableQuotation((prev) => {
      if (!prev) return null
      return { ...prev, [field]: date ? date.toISOString() : undefined }
    })
  }

  const handleStatusChange = (value: string) => {
    setEditableQuotation((prev) => (prev ? { ...prev, status: value as Quotation["status"] } : null))
  }

  const handleSaveEdit = async () => {
    if (!editableQuotation || !user?.uid || !userData?.first_name || !userData?.last_name) {
      toast({
        title: "Error",
        description: "Missing data to save quotation.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Ensure dates are valid Date objects before passing to service
      const startDateObj = getDateObject(editableQuotation.start_date)
      const endDateObj = getDateObject(editableQuotation.end_date)

      if (!startDateObj || !endDateObj) {
        throw new Error("Invalid start or end date for calculation.")
      }

      // Recalculate total amount based on current editable state
      const { durationDays, totalAmount } = calculateQuotationTotal(
        startDateObj.toISOString(),
        endDateObj.toISOString(),
        editableQuotation.products,
      )

      const updatedData: Partial<Quotation> = {
        ...editableQuotation,
        start_date: startDateObj.toISOString(),
        end_date: endDateObj.toISOString(),
        duration_days: durationDays,
        total_amount: totalAmount,
        // Ensure products array is explicitly passed
        products: editableQuotation.products,
      }

      await updateQuotation(
        editableQuotation.id!,
        updatedData,
        user.uid,
        `${userData.first_name} ${userData.last_name}`,
      )
      setQuotation(editableQuotation) // Update main quotation state
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Quotation updated successfully.",
      })
    } catch (error: any) {
      console.error("Error saving quotation:", error)
      toast({
        title: "Error",
        description: `Failed to save quotation: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleGeneratePDF = async () => {
    if (!quotation) {
      toast({
        title: "Error",
        description: "No quotation data to generate PDF.",
        variant: "destructive",
      })
      return
    }
    try {
      await generateQuotationPDF(quotation)
      toast({
        title: "PDF Generated",
        description: "Quotation PDF has been downloaded.",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-5xl mx-auto p-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="bg-white rounded-lg shadow-sm p-8 space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!quotation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Quotation Not Found</h1>
          <p className="text-gray-600 mb-6">The quotation you're looking for doesn't exist or may have been removed.</p>
          <Button onClick={() => router.push("/sales/quotations-list")} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Quotations
          </Button>
        </div>
      </div>
    )
  }

  const currentQuotation = isEditing ? editableQuotation : quotation

  if (!currentQuotation) return null // Should not happen if quotation is not null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Word-style Toolbar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/sales/quotations-list`)}
                className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-gray-300" />
              <div className="hidden md:flex items-center space-x-2">
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditClick}
                    className="text-gray-600 hover:text-gray-900 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="text-gray-600 hover:text-gray-900 text-xs"
                    >
                      {saving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                      Save
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGeneratePDF}
                  className="text-gray-600 hover:text-gray-900 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Export PDF
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Select value={currentQuotation.status} onValueChange={handleStatusChange} disabled={!isEditing}>
                <SelectTrigger className="w-20 sm:w-32 h-7 sm:h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  /* Implement send email logic */
                }}
                disabled={!isEditing || saving}
                className="bg-blue-600 hover:bg-blue-700 h-7 sm:h-8 px-2 sm:px-4 text-xs sm:text-sm"
              >
                <Send className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Send to Client</span>
                <span className="sm:hidden">Send</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Container */}
      <div className="max-w-5xl mx-auto p-2 sm:p-4 lg:p-8">
        <div
          className="bg-white rounded-lg shadow-lg min-h-screen sm:min-h-[11in] p-4 sm:p-8 lg:p-12"
          style={{ fontFamily: "Calibri, sans-serif" }}
        >
          {/* Document Header */}
          <div className="text-center mb-6 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-blue-600">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <img src="/oh-plus-logo.png" alt="OH Plus Logo" className="h-8 sm:h-10 lg:h-12 w-auto" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">QUOTATION</h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600">Digital Billboard Rental Services</p>
          </div>

          {/* Quotation Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-300 pb-2">
                Quotation Details
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row">
                  <span className="font-medium text-gray-700 sm:w-32 text-sm sm:text-base">Quotation No:</span>
                  <span className="text-gray-900 font-mono text-sm sm:text-base">
                    {currentQuotation.quotation_number}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="font-medium text-gray-700 sm:w-32 text-sm sm:text-base">Date:</span>
                  <span className="text-gray-900 text-sm sm:text-base">
                    {format(getDateObject(currentQuotation.created) || new Date(), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="font-medium text-gray-700 sm:w-32 text-sm sm:text-base">Valid Until:</span>
                  <span className="text-gray-900 text-sm sm:text-base">
                    {format(getDateObject(currentQuotation.valid_until) || new Date(), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row">
                  <span className="font-medium text-gray-700 sm:w-32 text-sm sm:text-base">Reference:</span>
                  <span className="text-gray-900 text-sm sm:text-base break-words">
                    {currentQuotation.proposalId || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-300 pb-2">
                Bill To
              </h3>
              <div className="space-y-1 sm:space-y-2">
                <div className="font-semibold text-gray-900 text-sm sm:text-base">{currentQuotation.client_name}</div>
                <div className="text-gray-700 text-sm sm:text-base break-words">{currentQuotation.client_email}</div>
                {/* Add other client details if available in currentQuotation.client */}
              </div>
            </div>
          </div>

          {/* Rental Period & Pricing */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-300 pb-2">
              Rental Period & Pricing
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Start Date</Label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1 h-8 sm:h-10 text-xs sm:text-sm",
                          !editableQuotation?.start_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {editableQuotation?.start_date ? (
                          format(getDateObject(editableQuotation.start_date)!, "MMM dd, yyyy")
                        ) : (
                          <span>Pick date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={getDateObject(editableQuotation?.start_date)}
                        onSelect={(date) => handleDateChange(date, "start_date")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    value={
                      currentQuotation.start_date
                        ? format(getDateObject(currentQuotation.start_date)!, "MMM dd, yyyy")
                        : "N/A"
                    }
                    disabled
                    className="bg-gray-100 mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                )}
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">End Date</Label>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal mt-1 h-8 sm:h-10 text-xs sm:text-sm",
                          !editableQuotation?.end_date && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {editableQuotation?.end_date ? (
                          format(getDateObject(editableQuotation.end_date)!, "MMM dd, yyyy")
                        ) : (
                          <span>Pick date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={getDateObject(editableQuotation?.end_date)}
                        onSelect={(date) => handleDateChange(date, "end_date")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <Input
                    value={
                      currentQuotation.end_date
                        ? format(getDateObject(currentQuotation.end_date)!, "MMM dd, yyyy")
                        : "N/A"
                    }
                    disabled
                    className="bg-gray-100 mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                  />
                )}
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">Duration</Label>
                <Input
                  value={`${currentQuotation.duration_days} days`}
                  disabled
                  className="bg-gray-100 mt-1 h-8 sm:h-10 text-xs sm:text-sm"
                />
              </div>

              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-700">
                  Price per Month (for all products)
                </Label>
                <Input
                  type="number"
                  name="price"
                  value={currentQuotation.products.reduce((sum, p) => sum + p.price, 0)} // Display sum of monthly prices
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={cn("mt-1 h-8 sm:h-10 text-xs sm:text-sm", isEditing && "bg-white")}
                />
              </div>
            </div>
          </div>

          {/* Quotation Summary Table */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-300 pb-2">
              Quotation Summary
            </h3>

            {/* Mobile Table */}
            <div className="block sm:hidden space-y-3">
              {currentQuotation.products.map((product) => {
                const dailyRate = (product.price || 0) / 30
                const productTotal = dailyRate * currentQuotation.duration_days
                return (
                  <div key={product.id} className="border border-gray-300 rounded-lg p-3 bg-white">
                    <div className="font-medium text-gray-900 text-sm mb-1">{product.name}</div>
                    <div className="text-xs text-gray-600 mb-2">{product.location}</div>
                    {product.site_code && (
                      <div className="text-xs text-gray-500 mb-2">Site Code: {product.site_code}</div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="ml-1 font-medium">{currentQuotation.duration_days} days</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rate/Day:</span>
                        <span className="ml-1 font-medium">
                          ₱{dailyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Total:</span>
                        <span className="font-bold text-sm">₱{productTotal.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-sm">TOTAL AMOUNT:</span>
                  <span className="font-bold text-lg text-blue-900">
                    ₱{currentQuotation.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-left font-semibold text-gray-900 text-xs sm:text-sm">
                      Description
                    </th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-center font-semibold text-gray-900 text-xs sm:text-sm">
                      Duration
                    </th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-900 text-xs sm:text-sm">
                      Rate/Day
                    </th>
                    <th className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-gray-900 text-xs sm:text-sm">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuotation.products.map((product) => {
                    const dailyRate = (product.price || 0) / 30
                    const productTotal = dailyRate * currentQuotation.duration_days
                    return (
                      <tr key={product.id}>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3">
                          <div className="font-medium text-gray-900 text-xs sm:text-sm">{product.name}</div>
                          <div className="text-xs text-gray-600">{product.location}</div>
                          {product.site_code && (
                            <div className="text-xs text-gray-500">Site Code: {product.site_code}</div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm">
                          {currentQuotation.duration_days} days
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right text-xs sm:text-sm">
                          ₱{dailyRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-semibold text-xs sm:text-sm">
                          ₱{productTotal.toLocaleString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-blue-50">
                    <td
                      colSpan={3}
                      className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-gray-900 text-xs sm:text-sm"
                    >
                      TOTAL AMOUNT:
                    </td>
                    <td className="border border-gray-300 px-2 sm:px-4 py-2 sm:py-3 text-right font-bold text-sm sm:text-xl text-blue-900">
                      ₱{currentQuotation.total_amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Terms and Notes */}
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 border-b border-gray-300 pb-2">
              Terms and Conditions
            </h3>
            <Textarea
              name="notes"
              value={currentQuotation.notes || ""}
              onChange={handleInputChange}
              placeholder="Enter terms, conditions, and additional notes..."
              rows={4}
              className="w-full border border-gray-300 rounded p-2 sm:p-3 text-xs sm:text-sm leading-relaxed"
              style={{ fontFamily: "Calibri, sans-serif" }}
              disabled={!isEditing}
            />
          </div>

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-4 sm:pt-6 mt-8 sm:mt-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Contact Information</h4>
                <div className="text-xs sm:text-sm text-gray-700 space-y-1">
                  <div>OH Plus Digital Solutions</div>
                  <div>Email: sales@ohplus.com</div>
                  <div>Phone: +63 (02) 8123-4567</div>
                  <div>Website: www.ohplus.com</div>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Authorized By</h4>
                <div className="mt-4 sm:mt-8 border-b border-gray-400 w-32 sm:w-48 sm:ml-auto"></div>
                <div className="text-xs sm:text-sm text-gray-700 mt-2">Sales Manager</div>
                <div className="text-xs text-gray-500 mt-1">Date: {format(new Date(), "MMM dd, yyyy")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
