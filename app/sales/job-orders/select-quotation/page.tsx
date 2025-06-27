"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search, FileText, CheckCircle, ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { getQuotationsForSelection } from "@/lib/job-order-service"
import type { Quotation } from "@/lib/types/quotation"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export default function SelectQuotationPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)

  useEffect(() => {
    const fetchQuotations = async () => {
      if (!user?.uid) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view quotations.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const fetchedQuotations = await getQuotationsForSelection(user.uid)
        setQuotations(fetchedQuotations)
      } catch (error) {
        console.error("Error fetching quotations:", error)
        toast({
          title: "Error",
          description: "Failed to load quotations. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchQuotations()
  }, [user?.uid, toast])

  const filteredQuotations = quotations.filter(
    (q) =>
      q.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.product_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelect = (quotation: Quotation) => {
    setSelectedQuotation(quotation)
  }

  const handleConfirm = () => {
    if (selectedQuotation) {
      router.push(`/sales/job-orders/create?quotationId=${selectedQuotation.id}`)
    } else {
      toast({
        title: "No Quotation Selected",
        description: "Please select a quotation to proceed.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Select Quotation for Job Order</h1>
      </div>

      <Card className="flex-1 flex flex-col p-6">
        <div className="relative mb-4">
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : filteredQuotations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No quotations found.
            {searchTerm && ` for "${searchTerm}"`}
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4 -mr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuotations.map((quotation) => (
                <Card
                  key={quotation.id}
                  className={cn(
                    "flex flex-col p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedQuotation?.id === quotation.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "hover:bg-gray-50",
                  )}
                  onClick={() => handleSelect(quotation)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-base">{quotation.quotation_number}</p>
                    {selectedQuotation?.id === quotation.id && <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </div>
                  <p className="text-sm text-gray-700 mb-1">Client: {quotation.client_name}</p>
                  <p className="text-sm text-gray-700 mb-1">Site: {quotation.product_name}</p>
                  <p className="text-sm text-gray-600 mb-2">
                    Sales:{" "}
                    {quotation.created_by_first_name || quotation.created_by_last_name
                      ? `${quotation.created_by_first_name || ""} ${quotation.created_by_last_name || ""}`.trim()
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-auto">
                    Created:{" "}
                    {quotation.created ? new Date(quotation.created.seconds * 1000).toLocaleDateString() : "N/A"}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedQuotation}>
            <FileText className="mr-2 h-4 w-4" /> Create Job Order
          </Button>
        </div>
      </Card>
    </div>
  )
}
