"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { format } from "date-fns"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { FileText, Plus, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function TreasuryQuotationsPage() {
  const { user } = useAuth()
  const [quotations, setQuotations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingCollectible, setCreatingCollectible] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; quotation: any | null }>({
    open: false,
    quotation: null,
  })
  const router = useRouter()
  const { toast } = useToast()

  const fetchAllQuotations = async () => {
    if (!user?.uid) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const quotationsRef = collection(db, "quotations")
      const q = query(
        quotationsRef,
        where("created_by", "==", user.uid),
        where("projectCompliance.signedQuotation.status", "==", "completed"),
        orderBy("created", "desc"),
      )

      const querySnapshot = await getDocs(q)
      const fetchedQuotations: any[] = []

      querySnapshot.forEach((doc) => {
        fetchedQuotations.push({ id: doc.id, ...doc.data() })
      })

      setQuotations(fetchedQuotations)
    } catch (error) {
      console.error("Error fetching quotations:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.uid) {
      fetchAllQuotations()
    }
  }, [user?.uid])

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    try {
      if (date && typeof date.toDate === "function") {
        return format(date.toDate(), "MMM d, yyyy")
      }
      if (typeof date === "string") {
        return format(new Date(date), "MMM d, yyyy")
      }
      return "Invalid date"
    } catch (error) {
      return "Invalid date"
    }
  }

  const handleViewPDF = (quotation: any) => {
    const fileUrl = quotation.projectCompliance?.signedQuotation?.fileUrl
    if (fileUrl) {
      window.open(fileUrl, "_blank")
    } else {
      console.error("No signed quotation file URL found")
    }
  }

  const validateQuotationData = (quotation: any) => {
    const errors: string[] = []

    if (!quotation.client_name || quotation.client_name.trim() === "") {
      errors.push("Client name is required")
    }

    if (!quotation.total_amount || quotation.total_amount <= 0) {
      errors.push("Valid total amount is required")
    }

    if (!quotation.quotation_number || quotation.quotation_number.trim() === "") {
      errors.push("Quotation number is required")
    }

    return errors
  }

  const handleCreateCollectible = async (quotation: any) => {
    if (!user?.uid) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a collectible.",
        variant: "destructive",
      })
      return
    }

    const validationErrors = validateQuotationData(quotation)
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: `Cannot create collectible: ${validationErrors.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setCreatingCollectible(quotation.id)

    try {
      const collectibleData = {
        type: quotation.type || "sites",
        client_name: quotation.client_name.trim(),
        net_amount: quotation.total_amount,
        total_amount: quotation.total_amount,
        mode_of_payment: "",
        bank_name: "",
        bi_no: "",
        or_no: "",
        invoice_no: quotation.quotation_number,
        booking_no: quotation.booking_number || "",
        site: quotation.site_location || "",
        status: "pending",
        deleted: false,
        created: serverTimestamp(),
        updated: serverTimestamp(),
        company_id: user?.company_id || user?.uid || "",
        source_quotation_id: quotation.id,
        source_quotation_number: quotation.quotation_number,
        created_from_quotation: true,
        quotation_date: quotation.created,
        client_contact: quotation.client_contact || "",
        project_description: quotation.project_description || "",
      }

      const docRef = await addDoc(collection(db, "collectibles"), collectibleData)

      toast({
        title: "Collectible Created Successfully",
        description: `A new collectible record has been created from quotation ${quotation.quotation_number} for client ${quotation.client_name}. You can now complete the remaining details.`,
      })

      setConfirmDialog({ open: false, quotation: null })

      router.push(`/treasury/collectibles/edit/${docRef.id}`)
    } catch (error) {
      console.error("Error creating collectible:", error)
      toast({
        title: "Creation Failed",
        description: "Failed to create collectible record. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setCreatingCollectible(null)
    }
  }

  const openCreateCollectibleDialog = (quotation: any) => {
    const validationErrors = validateQuotationData(quotation)
    if (validationErrors.length > 0) {
      toast({
        title: "Cannot Create Collectible",
        description: `Missing required data: ${validationErrors.join(", ")}`,
        variant: "destructive",
      })
      return
    }

    setConfirmDialog({ open: true, quotation })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        {user?.uid ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardHeader className="px-6 py-4 border-b border-gray-200">
              <CardTitle className="text-xl font-semibold text-gray-900">Treasury Signed Contracts</CardTitle>
              {!loading && (
                <div className="text-sm text-gray-600 mt-2">Showing {quotations.length} signed contracts</div>
              )}
            </CardHeader>

            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b border-gray-200">
                    <TableHead className="font-semibold text-gray-900 py-3">Contract Date</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Client Name</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Total Amount</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array(10)
                    .fill(0)
                    .map((_, i) => (
                      <TableRow key={i} className="border-b border-gray-100">
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell className="py-3">
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            ) : quotations.length > 0 ? (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-b border-gray-200">
                      <TableHead className="font-semibold text-gray-900 py-3">Contract Date</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Client Name</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Total Amount</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-3">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quotation) => (
                      <TableRow key={quotation.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="py-3 text-sm text-gray-700">{formatDate(quotation.created)}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-700">{quotation.client_name || "N/A"}</TableCell>
                        <TableCell className="py-3 text-sm text-gray-700">
                          ₱{quotation.total_amount?.toLocaleString() || "0"}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewPDF(quotation)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View PDF
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openCreateCollectibleDialog(quotation)}
                              disabled={creatingCollectible === quotation.id}
                              className="text-green-600 border-green-300 hover:bg-green-50 hover:text-green-700"
                            >
                              {creatingCollectible === quotation.id ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3 mr-1" />
                              )}
                              Create Collectible
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            ) : (
              <CardContent className="p-6 text-center text-gray-600">
                <p>No signed contracts found for your account.</p>
              </CardContent>
            )}
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="p-6 text-center text-gray-600">
              <p>Please log in to view your signed contracts.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, quotation: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Create Collectible Record
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to create a new collectible record from quotation{" "}
                <strong>{confirmDialog.quotation?.quotation_number}</strong> for client{" "}
                <strong>{confirmDialog.quotation?.client_name}</strong>.
              </p>
              <p className="text-sm text-gray-600">The following information will be automatically populated:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Client Name: {confirmDialog.quotation?.client_name}</li>
                <li>Total Amount: ₱{confirmDialog.quotation?.total_amount?.toLocaleString()}</li>
                <li>Invoice Number: {confirmDialog.quotation?.quotation_number}</li>
                <li>Status: Pending</li>
              </ul>
              <p className="text-sm text-amber-600 mt-2">
                You will be redirected to the edit page to complete the remaining details.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCreateCollectible(confirmDialog.quotation)}
              className="bg-green-600 hover:bg-green-700"
            >
              Create Collectible
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
