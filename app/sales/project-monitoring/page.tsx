"use client"

import { ArrowLeft, Search, ChevronDown, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/firebase-service"
import { Pagination } from "@/components/ui/pagination"

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
}

export default function ProjectMonitoringPage() {
  const router = useRouter()
  const { userData } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [jobOrderCounts, setJobOrderCounts] = useState<JobOrderCount>({})
  const [latestJoNumbers, setLatestJoNumbers] = useState<{ [productId: string]: string }>({})
  const [latestJoIds, setLatestJoIds] = useState<{ [productId: string]: string }>({})
  const [productReports, setProductReports] = useState<ProductReports>({})
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
        reportsByProduct[productId].sort((a, b) => {
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
          aTime = new Date(0) // Default to epoch if no date
        }

        if (b.createdAt?.toDate) {
          bTime = b.createdAt.toDate()
        } else if (b.createdAt) {
          bTime = new Date(b.createdAt)
        } else {
          bTime = new Date(0) // Default to epoch if no date
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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Project Bulletin</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Dropdown Filter */}
          <div className="flex-1 flex justify-end">
            <div className="relative">
              <select className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700">
                <option value="">Select Site</option>
                <option value="site1">Site 1</option>
                <option value="site2">Site 2</option>
                <option value="site3">Site 3</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : products.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products
                .filter((product) => latestJoNumbers[product.id!])
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg border border-gray-300 p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      console.log('Product ID:', product.id)
                      console.log('Latest JO IDs:', latestJoIds)
                      console.log('Latest JO ID for this product:', latestJoIds[product.id!])
                      if (latestJoIds[product.id!]) {
                        router.push(`/sales/project-monitoring/details/${latestJoIds[product.id!]}`)
                      } else {
                        console.log('No latest JO ID found for product:', product.id)
                      }
                    }}
                  >
                    <div className="text-blue-600 text-sm mb-3 rounded inline-block" style={{ backgroundColor: '#e7f1ff', fontWeight: '650' }}>
                      <span style={{ padding: '0 2px' }}>{latestJoNumbers[product.id!] || 'No JO'}</span>
                    </div>

                    {/* Project Title Banner */}
                    <div className="text-white px-4 py-2 rounded mb-3 w-fit" style={{ backgroundColor: "#00aeef", borderRadius: "10px" }}>
                      <h3 className="font-semibold text-lg">Lilo & Stitch</h3>
                    </div>

                    {/* Project Location */}
                    <div className="text-gray-900 font-medium mb-3">
                      {product.specs_rental?.location || product.name || "No site code available"}
                    </div>

                    {/* Last Activity Section */}
                    <div>
                      <h4 className="text-gray-700 font-medium mb-2">Last Activity:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {productReports[product.id!] && productReports[product.id!].length > 0 ? (
                          productReports[product.id!].slice(0, 3).map((report: Report, index: number) => {
                            const reportDate = report.updated?.toDate ? report.updated.toDate() : new Date(report.updated || report.date || 0)
                            const formattedDate = reportDate.toLocaleDateString("en-US", {
                              month: "numeric",
                              day: "numeric",
                              year: "2-digit",
                            })
                            const formattedTime = reportDate.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })

                            return (
                              <div key={report.id}>
                                {formattedDate} {formattedTime} - {report.descriptionOfWork || report.description || "No description available"}
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-gray-500 italic">No recent activity</div>
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
          <div className="text-center py-8 text-gray-500">No products found</div>
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
                  {jobOrders.map((jobOrder) => (
                    <div
                      key={jobOrder.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/sales/project-monitoring/details/${jobOrder.id}`)}
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
