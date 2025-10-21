"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Plus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  project_name?: string
  reservation_id?: string
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
        } else {
          // Try as product
          const productRef = doc(db, "products", params.id as string)
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
        return dateField.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      } else if (dateField) {
        const date = new Date(dateField)
        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    } else if (product) {
      return {
        site: product.specs_rental?.location || product.name || "Not specified",
        client: "Not specified",
        bookingDates: "Not specified",
        seller: seller?.first_name && seller?.last_name ? `${seller.first_name} ${seller.last_name}` : "Not specified",
      }
    }

    return {
      site: "Not specified",
      client: "Not specified",
      bookingDates: "Not specified",
      seller: "Not specified",
    }
  }

  const siteData = getSiteData()

  return (
    <div className="w-[1280px] h-[720px] relative">
      <div onClick={() => router.back()} className="w-80 h-6 left-[30px] top-[30px] absolute justify-start text-gray-700 text-base font-bold font-['Inter'] leading-none cursor-pointer">← View Project Bulletin</div>
      <div className="w-[990px] h-20 left-[34px] top-[60px] absolute bg-white rounded-[5px] shadow-[-2px_4px_5px_0px_rgba(0,0,0,0.25)]" />
      <div className="w-24 h-3.5 left-[60.14px] top-[80.44px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Reservation ID</div>
      <div className="w-32 h-3.5 left-[60.14px] top-[96.95px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">{booking?.reservation_id || 'N/A'}</div>
      <div className="w-24 h-3.5 left-[250px] top-[80.44px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Site</div>
      <div className="w-40 h-6 left-[250px] top-[96.95px] absolute justify-start text-blue-600 text-xs font-bold font-['Inter'] leading-3 break-words">{siteData.site}</div>
      <div className="w-24 h-3.5 left-[453px] top-[84px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Client</div>
      <div className="w-24 h-3 left-[453px] top-[99.56px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">{siteData.client}</div>
      <div className="w-24 h-3.5 left-[647px] top-[80.44px] absolute justify-start text-gray-700 text-xs font-semibold font-['Inter'] leading-3">Booking Dates</div>
      <div className="w-36 h-3 left-[647px] top-[96px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">{siteData.bookingDates}</div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="w-24 h-6 left-[905px] top-[84.40px] absolute bg-white rounded-md border border-gray-300 cursor-pointer flex items-center justify-between px-2">
            <span className="text-gray-700 text-xs font-medium">Actions</span>
            <ChevronDown className="w-3 h-3 text-gray-700" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setCreateReportDialogOpen(true)}>Create Report</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="w-[990px] h-7 left-[34px] top-[162px] absolute" style={{ backgroundColor: 'var(--ADMIN-BLUE, #2A31B4)' }} />
      <div className="w-14 h-4 left-[60px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Date</div>
      <div className="w-14 h-4 left-[179px] top-[169px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">By</div>
      <div className="w-20 h-4 left-[342px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Department</div>
      <div className="w-14 h-4 left-[674px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Item</div>
      <div className="w-24 h-4 left-[495px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Campaign Name</div>
      <div className="w-28 h-4 left-[873px] top-[170px] absolute justify-start text-white text-xs font-semibold font-['Inter'] leading-3">Attachment</div>
      <div className="w-[990px] h-[496px] left-[34px] top-[190px] absolute bg-white overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">No project monitoring data available for this {jobOrder ? 'job order' : 'product'}.</div>
          </div>
        ) : (
          <div className="space-y-0">
            {reports.map((report, index) => (
              <div key={report.id} className="relative h-16">
                <div className="w-24 h-3.5 left-[26.14px] top-[16px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">
                  {formatDate(report.updated || report.created || report.date)}
                </div>
                <div className="w-28 h-3.5 left-[140px] top-[16px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">
                  {'System'}
                </div>
                <div className="w-28 h-3.5 left-[303px] top-[16px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">
                  {getTeamBadge(report.category).props.children || report.category}
                </div>
                <div className="w-28 h-3.5 left-[636px] top-[16px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">
                  {getUpdateText(report)}
                </div>
                <div className="w-28 h-3.5 left-[457px] top-[16px] absolute justify-start text-gray-700 text-xs font-normal font-['Inter'] leading-3">
                  {booking?.project_name || 'N/A'}
                </div>
                <div className="w-28 h-3.5 left-[834px] top-[16px] absolute justify-start text-blue-600 text-xs font-bold font-['Inter'] underline leading-3">
                  {report.attachments && report.attachments.length > 0 ? 'View Attachment' : 'N/A'}
                </div>
                {index < reports.length - 1 && (
                  <div className="w-[970px] h-0 left-[12px] top-[50px] absolute outline outline-1 outline-offset-[-0.50px] outline-black/25"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
