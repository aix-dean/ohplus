"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreateReportDialog } from "@/components/create-report-dialog"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, startAfter, QueryDocumentSnapshot, DocumentData } from "firebase/firestore"

interface JobOrder {
  id: string
  joNumber: string
  clientCompany: string
  clientName: string
  siteName: string
  siteCode: string
  contractPeriodStart: string
  contractPeriodEnd: string
  leaseRatePerMonth: number
  totalAmount: number
  status: string
  joType: string
  assignTo: string
  product_id?: string
  // Add other fields as needed
}

interface Seller {
  id: string
  first_name?: string
  last_name?: string
  uid: string
  // Add other fields as needed
}

interface Product {
  id: string
  name?: string
  location?: string
  site_owner?: string
  seller_name?: string
  seller_id?: string // Added seller_id field
  price?: number
  status?: string
  media?: Array<{
    distance: string
    isVideo: boolean
    type: string
    url: string
  }>
  specs_rental?: {
    location?: string
    caretaker?: string
    land_owner?: string
    site_orientation?: string
    structure_condition?: string
  }
  created?: any
  updated?: any
}

interface Booking {
  id: string
  start_date: any
  end_date: any
  product_id: string
  status: string
  cost: number
  total_cost: number
  type: string
  // Add other fields as needed
}

interface Report {
  id: string
  joNumber: string
  date: string
  created: any
  updated: any
  category: string
  subcategory: string
  status: string
  reportType: string
  attachments?: Array<{
    fileName: string
    fileType: string
    fileUrl: string
    note?: string
  }>
  // Add other fields as needed
}

export default function JobOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [booking, setBooking] = useState<Booking | null>(null)
  const [seller, setSeller] = useState<Seller | null>(null) // Added seller state
  const [reports, setReports] = useState<Report[]>([]) // Added reports state
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any])
  const [hasMore, setHasMore] = useState(true)

  const [createReportDialogOpen, setCreateReportDialogOpen] = useState(false)

  const fetchReports = async (joNumber: string, page: number = 1) => {
    try {
      const reportsRef = collection(db, "reports")
      let reportsQuery = query(
        reportsRef,
        where("joNumber", "==", joNumber),
        orderBy("updated", "desc"),
        limit(itemsPerPage + 1)
      )

      const lastDoc = lastVisibleDocs[page - 1]
      if (lastDoc && page > 1) {
        reportsQuery = query(
          reportsRef,
          where("joNumber", "==", joNumber),
          orderBy("updated", "desc"),
          startAfter(lastDoc),
          limit(itemsPerPage + 1)
        )
      }

      const reportsSnapshot = await getDocs(reportsQuery)
      const reportsData = reportsSnapshot.docs.slice(0, itemsPerPage).map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Report[]

      const newLastVisible = reportsSnapshot.docs[reportsSnapshot.docs.length - 1]
      setHasMore(reportsSnapshot.docs.length > itemsPerPage)

      if (newLastVisible && page === lastVisibleDocs.length) {
        setLastVisibleDocs((prev) => [...prev, newLastVisible])
      }

      setReports(reportsData)
    } catch (error) {
      console.error("Error fetching reports:", error)
      setReports([])
    }
  }

  useEffect(() => {
    const fetchJobOrder = async () => {
      if (!params.id) return

      try {
        const docRef = doc(db, "job_orders", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const jobOrderData = {
            id: docSnap.id,
            ...docSnap.data(),
          } as JobOrder

          setJobOrder(jobOrderData)

          if (jobOrderData.joNumber) {
            await fetchReports(jobOrderData.joNumber, 1)
          }

          if (jobOrderData.product_id) {
            const productRef = doc(db, "products", jobOrderData.product_id)
            const productSnap = await getDoc(productRef)

            if (productSnap.exists()) {
              const productData = {
                id: productSnap.id,
                ...productSnap.data(),
              } as Product

              setProduct(productData)

              if (productData.seller_id) {
                const sellerRef = doc(db, "iboard_users", productData.seller_id)
                const sellerSnap = await getDoc(sellerRef)

                if (sellerSnap.exists()) {
                  setSeller({
                    id: sellerSnap.id,
                    ...sellerSnap.data(),
                  } as Seller)
                }
              }
            }

            const bookingQuery = query(collection(db, "booking"), where("product_id", "==", jobOrderData.product_id))
            const bookingSnapshot = await getDocs(bookingQuery)

            if (!bookingSnapshot.empty) {
              const bookingDoc = bookingSnapshot.docs[0]
              setBooking({
                id: bookingDoc.id,
                ...bookingDoc.data(),
              } as Booking)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching job order, product, booking, seller, or reports:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobOrder()
  }, [params.id])

  useEffect(() => {
    if (jobOrder?.joNumber && currentPage > 1) {
      fetchReports(jobOrder.joNumber, currentPage)
    }
  }, [currentPage, jobOrder?.joNumber])

  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prevPage) => prevPage + 1)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1)
    }
  }

  const formatDate = (dateField: any) => {
    if (!dateField) return "Not specified"

    try {
      if (dateField?.toDate) {
        return dateField.toDate().toLocaleDateString()
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString()
      }
      return "Not specified"
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatTime = (dateField: any) => {
    if (!dateField) return "N/A"

    try {
      if (dateField?.toDate) {
        return dateField.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
      return "N/A"
    } catch (error) {
      return "N/A"
    }
  }

  const getTeamBadge = (category: string) => {
    switch (category.toLowerCase()) {
      case "sales":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">Sales</Badge>
      case "logistics":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Logistics</Badge>
      case "installer":
      case "installation":
        return <Badge className="bg-green-500 hover:bg-green-600 text-white">Installer</Badge>
      case "delivery":
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white">Delivery</Badge>
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">{category}</Badge>
    }
  }

  const getUpdateText = (report: Report) => {
    if (report.reportType === "completion-report") {
      return `Completion report submitted - ${report.subcategory || "general"}`
    }
    return report.subcategory || report.reportType || "Report submitted"
  }

  const getSiteData = () => {
    if (jobOrder) {
      return {
        site: jobOrder.siteName || jobOrder.siteCode || "Not specified",
        client: jobOrder.clientName || "Not specified",
        bookingDates:
          booking?.start_date && booking?.end_date
            ? `${formatDate(booking.start_date)} to ${formatDate(booking.end_date)}`
            : "Not specified",
        seller: seller?.first_name && seller?.last_name ? `${seller.first_name} ${seller.last_name}` : "Not specified",
      }
    }

    return {
      site: "Not specified",
      client: "Not specified",
      bookingDates: "Not specified",
      seller: "Not specified", // Added seller fallback
    }
  }

  const siteData = getSiteData()

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center gap-3 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-1 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Badge variant="default" className="bg-blue-500 text-white px-3 py-1 text-sm font-medium" style={{ fontSize: '27.7px', fontWeight: '700', borderRadius: '10px' }}>
          Lilo & Stitch
        </Badge>

        <div style={{ borderRadius: '10px', padding: '0 10px', backgroundColor: '#efefef' }}>
          <span className="text-lg font-medium text-gray-900" style={{ fontSize: '25.1px', color: '#0f76ff', fontWeight: '650' }}>
            {loading ? "Loading..." : jobOrder?.joNumber || "Job Order Not Found"}
          </span>
        </div>
      </div>

      <div className="flex justify-start">
        <div className="flex items-start gap-6 max-w-2xl">
          {/* Product image placeholder */}
          <div className="flex-shrink-0">
            <img
              src={product?.media?.[0]?.url || "/lilo-and-stitch-product-box.png"}
              alt="Product"
              className="w-32 h-32 object-cover rounded-md border"
            />
          </div>

          {/* Site information */}
          <div className="flex-1 space-y-3 text-base">
            <div>
              <span className="font-semibold text-gray-900">Site: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.site}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Client: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.client}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Booking Dates: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.bookingDates}</span>
            </div>

            <div>
              <span className="font-semibold text-gray-900">Seller: </span>
              <span className="text-gray-700">{loading ? "Loading..." : siteData.seller}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-gradient-to-r from-blue-600 to-teal-400 text-white px-4 py-3 rounded-t-lg">
          <h2 className="text-lg font-semibold">Project Monitoring</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Time</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Team</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Update</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Attachments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading project monitoring data...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No project monitoring data available for this job order.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(report.updated || report.created || report.date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatTime(report.updated || report.created)}</td>
                    <td className="px-4 py-3">{getTeamBadge(report.category)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <button
                        className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        onClick={() => router.push(`/logistics/reports/${report.id}`)}
                      >
                        {getUpdateText(report)}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {report.attachments && report.attachments.length > 0 ? (
                        <button
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          onClick={() => window.open(report.attachments![0].fileUrl, "_blank")}
                        >
                          See Attachment
                        </button>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {reports.length > 0 && (
          <div className="flex justify-between items-center mt-4 px-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage}
            </span>
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-lg px-4 py-2 flex items-center gap-2"
          onClick={() => {
            if (jobOrder?.product_id) {
              setCreateReportDialogOpen(true)
            } else {
              console.log("No product ID available for creating report")
            }
          }}
        >
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      {jobOrder?.product_id && (
        <CreateReportDialog
          open={createReportDialogOpen}
          onOpenChange={setCreateReportDialogOpen}
          siteId={jobOrder.product_id}
          module="sales"
          hideJobOrderSelection={true}
          preSelectedJobOrder={jobOrder.joNumber}
        />
      )}
    </div>
  )
}
