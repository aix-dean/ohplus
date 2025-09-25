"use client"

import { ArrowLeft, Search, X, FileText, Loader2, CheckCircle, PlusCircle, MoreVertical, List, Grid3X3 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/firebase-service"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface JobOrderCount {
  [productId: string]: number
}

interface JobOrder {
  id: string
  joNumber: string
  product_id: string
  company_id: string
  status: string
  createdAt: any
  updatedAt: any
  [key: string]: any
}

interface Report {
  id: string
  joNumber: string
  date: any
  updated: any
  category: string
  status: string
  description: string
  descriptionOfWork?: string
  attachments?: string[]
  [key: string]: any
}

interface ProductReports {
  [productId: string]: Report[]
}

interface Booking {
  id: string
  product_id?: string
  product_owner?: string
  client_name?: string
  start_date?: any
  end_date?: any
  status?: string
  created?: any
  quotation_id?: string
  project_name?: string
}

export default function LogisticsBulletinBoardPage() {
  const router = useRouter()
  const { user, userData } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [jobOrderCounts, setJobOrderCounts] = useState<JobOrderCount>({})
  const [latestJoNumbers, setLatestJoNumbers] = useState<{ [productId: string]: string }>({})
  const [latestJoIds, setLatestJoIds] = useState<{ [productId: string]: string }>({})
  const [productReports, setProductReports] = useState<ProductReports>({})
  const [projectNames, setProjectNames] = useState<{ [productId: string]: string }>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogLoading, setIsDialogLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any])
  const [hasMore, setHasMore] = useState(true)



  const fetchProductReports = async (productIds: string[]) => {
    if (!userData?.company_id || productIds.length === 0) return

    try {
      // First, get all job orders for the products
      const jobOrdersRef = collection(db, "job_orders")
      const jobOrdersQuery = query(jobOrdersRef, where("company_id", "==", userData.company_id))
      const jobOrdersSnapshot = await getDocs(jobOrdersQuery)

      // Create a map of joNumber to product_id
      const joNumberToProductId: { [joNumber: string]: string } = {}
      jobOrdersSnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.joNumber && data.product_id && productIds.includes(data.product_id)) {
          joNumberToProductId[data.joNumber] = data.product_id
        }
      })

      // Get all joNumbers for the products
      const joNumbers = Object.keys(joNumberToProductId)

      if (joNumbers.length === 0) return

      // Fetch reports for these joNumbers and company
      const reportsRef = collection(db, "reports")
      const reportsQuery = query(
        reportsRef,
        where("joNumber", "in", joNumbers),
        where("companyId", "==", userData.company_id)
      )
      const reportsSnapshot = await getDocs(reportsQuery)

      // Group reports by product_id
      const reportsByProduct: ProductReports = {}
      reportsSnapshot.forEach((doc) => {
        const reportData = { id: doc.id, ...doc.data() } as Report
        const productId = joNumberToProductId[reportData.joNumber]

        if (productId) {
          if (!reportsByProduct[productId]) {
            reportsByProduct[productId] = []
          }
          reportsByProduct[productId].push(reportData)
        }
      })

      // Sort reports by updated timestamp (newest first) for each product
      Object.keys(reportsByProduct).forEach((productId) => {
        reportsByProduct[productId].sort((a: Report, b: Report) => {
          const aTime = a.updated?.toDate ? a.updated.toDate() : new Date(a.updated || a.date || 0)
          const bTime = b.updated?.toDate ? b.updated.toDate() : new Date(b.updated || b.date || 0)
          return bTime.getTime() - aTime.getTime()
        })
      })

      setProductReports(reportsByProduct)
    } catch (error) {
      console.error("Error fetching product reports:", error)
    }
  }

  const fetchJobOrderCounts = async (productIds: string[]) => {
    if (!userData?.company_id || productIds.length === 0) return

    try {
      const counts: JobOrderCount = {}
      const latestJoNumbersMap: { [productId: string]: string } = {}
      const latestJoIdsMap: { [productId: string]: string } = {}

      // Fetch job orders for all products at once
      const jobOrdersRef = collection(db, "job_orders")
      const q = query(jobOrdersRef, where("company_id", "==", userData.company_id))
      const querySnapshot = await getDocs(q)

      // Group job orders by productId
      const jobOrdersByProduct: { [productId: string]: JobOrder[] } = {}
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        const productId = data.product_id
        if (productId && productIds.includes(productId)) {
          if (!jobOrdersByProduct[productId]) {
            jobOrdersByProduct[productId] = []
          }
          jobOrdersByProduct[productId].push({ id: doc.id, ...data } as JobOrder)
        }
      })

      // For each product, sort job orders by createdAt descending and get latest joNumber and ID
      Object.keys(jobOrdersByProduct).forEach((productId) => {
        const jobOrders = jobOrdersByProduct[productId]
        counts[productId] = jobOrders.length

        if (jobOrders.length > 0) {
          // Sort by createdAt descending (newest first)
          jobOrders.sort((a, b) => {
            let aTime: Date
            let bTime: Date

            if (a.createdAt?.toDate) {
              aTime = a.createdAt.toDate()
            } else if (a.createdAt) {
              aTime = new Date(a.createdAt)
            } else {
              aTime = new Date(0)
            }

            if (b.createdAt?.toDate) {
              bTime = b.createdAt.toDate()
            } else if (b.createdAt) {
              bTime = new Date(b.createdAt)
            } else {
              bTime = new Date(0)
            }

            return bTime.getTime() - aTime.getTime()
          })

          // Get the latest job order
          const latestJo = jobOrders[0]
          latestJoNumbersMap[productId] = latestJo.joNumber || latestJo.id.slice(-6)
          latestJoIdsMap[productId] = latestJo.id
        }
      })

      console.log('Job Order Counts:', counts)
      console.log('Latest JO Numbers:', latestJoNumbersMap)
      console.log('Latest JO IDs:', latestJoIdsMap)
      setJobOrderCounts(counts)
      setLatestJoNumbers(latestJoNumbersMap)
      setLatestJoIds(latestJoIdsMap)
    } catch (error) {
      console.error("Error fetching job order counts:", error)
    }
  }

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

  const handleOpenDialog = async (product: Product) => {
    setSelectedProduct(product)
    setIsDialogOpen(true)
    setIsDialogLoading(true)

    try {
      if (!userData?.company_id) return

      const jobOrdersRef = collection(db, "job_orders")
      const q = query(
        jobOrdersRef,
        where("company_id", "==", userData.company_id),
        where("product_id", "==", product.id),
      )
      const querySnapshot = await getDocs(q)

      const fetchedJobOrders: JobOrder[] = []
      querySnapshot.forEach((doc) => {
        fetchedJobOrders.push({ id: doc.id, ...doc.data() } as JobOrder)
      })

      fetchedJobOrders.sort((a, b) => {
        let aTime: Date
        let bTime: Date

        // Handle Firestore Timestamp objects
        if (a.createdAt?.toDate) {
          aTime = a.createdAt.toDate()
        } else if (a.createdAt) {
          aTime = new Date(a.createdAt)
        } else {
          aTime = new Date(0)
        }

        if (b.createdAt?.toDate) {
          bTime = b.createdAt.toDate()
        } else if (b.createdAt) {
          bTime = new Date(b.createdAt)
        } else {
          bTime = new Date(0)
        }

        // Sort descending (newest first)
        return bTime.getTime() - aTime.getTime()
      })

      setJobOrders(fetchedJobOrders)
    } catch (error) {
      console.error("Error fetching job orders:", error)
      setJobOrders([])
    } finally {
      setIsDialogLoading(false)
    }
  }


  useEffect(() => {
    const fetchBookings = async () => {
      if (!userData?.company_id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const bookingsRef = collection(db, "booking")
        let bookingsQuery = query(
          bookingsRef,
          where("company_id", "==", userData.company_id),
          where("quotation_id", "!=", null),
          orderBy("created", "desc"),
          limit(itemsPerPage + 1)
        )

        const lastDoc = lastVisibleDocs[currentPage - 1]
        if (lastDoc) {
          bookingsQuery = query(
            bookingsRef,
            where("company_id", "==", userData.company_id),
            where("quotation_id", "!=", null),
            orderBy("created", "desc"),
            startAfter(lastDoc),
            limit(itemsPerPage + 1)
          )
        }

        const querySnapshot = await getDocs(bookingsQuery)
        const fetchedBookings: Booking[] = []
        const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]

        setHasMore(querySnapshot.docs.length > itemsPerPage)

        querySnapshot.docs.slice(0, itemsPerPage).forEach((doc) => {
          fetchedBookings.push({ id: doc.id, ...doc.data() })
        })

        setBookings(fetchedBookings)

        // Create project names map
        const namesMap: { [productId: string]: string } = {}
        fetchedBookings.forEach((booking) => {
          if (booking.product_id && booking.project_name) {
            namesMap[booking.product_id] = booking.project_name
          }
        })
        setProjectNames(namesMap)

        // Only update lastVisibleDocs if we are moving to a new page
        if (newLastVisible && currentPage === lastVisibleDocs.length) {
          setLastVisibleDocs((prev) => [...prev, newLastVisible])
        }

        const productIds = fetchedBookings
          .map((booking) => booking.product_id)
          .filter((id): id is string => Boolean(id))

        const uniqueProductIds = [...new Set(productIds)]
        const productData: { [key: string]: Product } = {}

        for (const productId of uniqueProductIds) {
          try {
            const productDoc = await getDoc(doc(db, "products", productId))
            if (productDoc.exists()) {
              productData[productId] = { id: productDoc.id, ...productDoc.data() } as Product
            }
          } catch (error) {
            console.error(`Error fetching product ${productId}:`, error)
          }
        }

        setProducts(Object.values(productData).filter(p => p.id))

        if (uniqueProductIds.length > 0) {
          await fetchJobOrderCounts(uniqueProductIds)
          await fetchProductReports(uniqueProductIds)
        }
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
   }, [userData?.company_id, currentPage, itemsPerPage, lastVisibleDocs.length])




  return (
    <div className="p-6 bg-[#fafafa] min-h-screen" role="main" aria-labelledby="logistics-bulletin-title">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 id="logistics-bulletin-title" className="text-2xl font-semibold text-[#333333]">Logistics Bulletin Board</h1>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#b7b7b7] h-4 w-4" aria-hidden="true" />
          <Input
            placeholder="Search projects..."
            className="pl-10 bg-[#ffffff] border-[#c4c4c4] text-[#333333] placeholder:text-[#b7b7b7] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            aria-label="Search projects"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-[#b7b7b7] hover:text-[#333333] hover:bg-gray-100 transition-colors" aria-label="List view" title="Switch to list view">
            <List className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#333333] bg-gray-100" aria-label="Grid view (current)" title="Grid view (currently active)" aria-pressed="true">
            <Grid3X3 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>


      <div>
        {loading ? (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
            <span className="sr-only">Loading project data</span>
          </div>
        ) : products.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products
                .filter((product: Product) => latestJoNumbers[product.id!])
                .map((product: Product) => (
                  <div
                    key={product.id}
                    className="bg-[#ffffff] border border-[#c4c4c4] p-4 relative cursor-pointer hover:shadow-lg focus-within:shadow-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    style={{ width: '461.339px', height: '284px' }}
                    onClick={() => {
                      console.log('Product ID:', product.id)
                      console.log('Latest JO IDs:', latestJoIds)
                      console.log('Latest JO ID for this product:', latestJoIds[product.id!])
                      if (latestJoIds[product.id!]) {
                        router.push(`/logistics/bulletin-board/details/${latestJoIds[product.id!]}`)
                      } else {
                        console.log('No latest JO ID found for product:', product.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Project: ${projectNames[product.id!] || "No Project Name"}, JO Number: ${latestJoNumbers[product.id!] || 'No JO'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (latestJoIds[product.id!]) {
                          router.push(`/logistics/bulletin-board/details/${latestJoIds[product.id!]}`)
                        }
                      }
                    }}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 text-[#b7b7b7] hover:text-[#333333] hover:bg-gray-100 p-1 transition-colors"
                      aria-label="More options"
                      title="More options"
                    >
                      <MoreVertical className="h-4 w-4" aria-hidden="true" />
                    </Button>

                    <div className="flex items-start gap-4">
                      <Image src={product.media?.[0]?.url || '/placeholder.jpg'} alt={`Site image for ${projectNames[product.id!] || "project"}`} width={108} height={108} className="object-cover rounded-lg mb-4" style={{ width: '108.429px', height: '108.429px' }} onError={(e) => { const target = e.target as HTMLImageElement; target.src = '/placeholder.jpg' }} />
                      <div className="flex-1">
                        <div className="mb-1" style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontStyle: 'normal', fontWeight: '600', lineHeight: '100%' }}>{latestJoNumbers[product.id!] || 'No JO'}</div>

                        <h3 className="mb-2" style={{ color: '#000', fontFamily: 'Inter', fontSize: '31px', fontStyle: 'normal', fontWeight: '600', lineHeight: '100%' }}>{projectNames[product.id!] || "No Project Name"}</h3>

                        <div className="mb-2">
                          <span style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontStyle: 'normal', fontWeight: '600', lineHeight: '100%' }}>Site:</span> <span style={{ color: '#000', fontFamily: 'Inter', fontSize: '16px', fontStyle: 'normal', fontWeight: '400', lineHeight: '100%' }}>{product.specs_rental?.location || product.name || "No site code available"}</span>
                        </div>
                      </div>
                    </div>

                    <hr className="my-2 border-[#c4c4c4]" />

                    <div>
                      <h4 className="mb-2" style={{ color: '#000', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'normal', fontWeight: '600', lineHeight: '100%' }}>Latest Activities:</h4>
                      <div className="space-y-1">
                        {productReports[product.id!] && productReports[product.id!].length > 0 ? (
                          productReports[product.id!].slice(0, 3).map((report: Report, index: number) => {
                            const reportDate = report.updated?.toDate ? report.updated.toDate() : new Date(report.updated || report.date || 0)
                            const formattedDate = reportDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })

                            return (
                              <div key={report.id} style={{ color: '#000', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'normal', fontWeight: '300', lineHeight: '100%' }}>
                                {formattedDate} - {report.descriptionOfWork || report.description || "No description available"}
                              </div>
                            )
                          })
                        ) : (
                          <div style={{ color: '#000', fontFamily: 'Inter', fontSize: '12px', fontStyle: 'normal', fontWeight: '300', lineHeight: '100%' }}>No recent activity</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-end mt-4">
              <Pagination
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={products.length} // This will be inaccurate for true total, but works for current page display
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                hasMore={hasMore}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-12" role="status" aria-live="polite">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">Try adjusting your search criteria or check back later.</p>
          </div>
        )}
      </div>


      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] max-h-[80vh] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Orders</h2>
              {selectedProduct && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedProduct.specs_rental?.location || selectedProduct.name || "Unknown Site"}
                </p>
              )}
            </div>

            {isDialogLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-500">Loading job orders...</p>
              </div>
            ) : jobOrders.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {jobOrders.map((jobOrder: JobOrder) => (
                    <div
                      key={jobOrder.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/logistics/bulletin-board/details/${jobOrder.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900">
                          Job Order #: {jobOrder.joNumber || jobOrder.id.slice(-6)}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            jobOrder.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : jobOrder.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : jobOrder.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {jobOrder.status || "Unknown"}
                        </span>
                      </div>

                      {jobOrder.description && <p className="text-sm text-gray-600 mb-2">{jobOrder.description}</p>}

                      <div className="text-xs text-gray-500">
                        Created: {(() => {
                          if (jobOrder.createdAt?.toDate) {
                            return jobOrder.createdAt.toDate().toLocaleDateString()
                          } else if (jobOrder.createdAt) {
                            const date = new Date(jobOrder.createdAt)
                            return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString()
                          }
                          return "Unknown"
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No job orders found for this site</div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
