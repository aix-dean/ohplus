"use client"

import { ArrowLeft, Search, X, FileText, Loader2, CheckCircle, PlusCircle, MoreVertical, List, Grid3X3, Bell, Settings, Camera } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/firebase-service"
import { searchBookings } from "@/lib/algolia-service"
import { Pagination } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
  reservation_id?: string
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
  const [bookingIds, setBookingIds] = useState<{ [productId: string]: string }>({})
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDialogLoading, setIsDialogLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any])
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const fetchProductReports = async (productIds: string[]) => {
    if (!userData?.company_id || productIds.length === 0) return

    try {
      // Get job orders for the specific products to build joNumber mapping
      const jobOrdersRef = collection(db, "job_orders")
      const batchSize = 10
      const joNumberToProductId: { [joNumber: string]: string } = {}

      // Batch fetch job orders by product_id
      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)
        const jobOrdersQuery = query(
          jobOrdersRef,
          where("company_id", "==", userData.company_id),
          where("product_id", "in", batch)
        )
        const jobOrdersSnapshot = await getDocs(jobOrdersQuery)

        jobOrdersSnapshot.forEach((doc) => {
          const data = doc.data()
          if (data.joNumber && data.product_id) {
            joNumberToProductId[data.joNumber] = data.product_id
          }
        })
      }

      // Get all joNumbers for the products
      const joNumbers = Object.keys(joNumberToProductId)

      if (joNumbers.length === 0) return

      // Batch fetch reports by joNumber
      const reportsByProduct: ProductReports = {}
      const reportBatchSize = 10

      for (let i = 0; i < joNumbers.length; i += reportBatchSize) {
        const batch = joNumbers.slice(i, i + reportBatchSize)
        const reportsRef = collection(db, "reports")
        const reportsQuery = query(
          reportsRef,
          where("joNumber", "in", batch),
          where("companyId", "==", userData.company_id)
        )
        const reportsSnapshot = await getDocs(reportsQuery)

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
      }

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

      // Batch fetch job orders by product_id in chunks of 10 (Firestore 'in' limit)
      const batchSize = 10
      const jobOrderPromises: Promise<void>[] = []

      for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize)
        jobOrderPromises.push(
          (async () => {
            try {
              const jobOrdersRef = collection(db, "job_orders")
              const q = query(
                jobOrdersRef,
                where("company_id", "==", userData.company_id),
                where("product_id", "in", batch)
              )
              const querySnapshot = await getDocs(q)

              // Group job orders by productId
              const jobOrdersByProduct: { [productId: string]: JobOrder[] } = {}
              querySnapshot.forEach((doc) => {
                const data = doc.data()
                const productId = data.product_id
                if (productId) {
                  if (!jobOrdersByProduct[productId]) {
                    jobOrdersByProduct[productId] = []
                  }
                  jobOrdersByProduct[productId].push({ id: doc.id, ...data } as JobOrder)
                }
              })

              // Process each product's job orders
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
            } catch (error) {
              console.error(`Error fetching job orders batch:`, error)
            }
          })()
        )
      }

      await Promise.all(jobOrderPromises)

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

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
    setLastVisibleDocs([null as any])
    setHasMore(true)
  }, [debouncedSearchTerm])

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

        // If there's a search term, use Algolia search
        if (debouncedSearchTerm.trim()) {
          const searchResults = await searchBookings(debouncedSearchTerm.trim(), userData.company_id, currentPage - 1, itemsPerPage)

          if (searchResults.error) {
            console.error("Search error:", searchResults.error)
            setBookings([])
            setProducts([])
            setProjectNames({})
            setBookingIds({})
            setHasMore(false)
            return
          }


          // Transform Algolia results to match expected format
          const fetchedBookings: Booking[] = searchResults.hits.map((hit: any) => ({
            id: hit.objectID,
            product_id: hit.product_id,
            product_owner: hit.product_owner || hit.product_name,
            client_name: hit.client_name || hit.client?.name,
            start_date: hit.start_date,
            end_date: hit.end_date,
            status: hit.status,
            created: hit.created ? new Date(hit.created) : null,
            quotation_id: hit.quotation_id,
            project_name: hit.project_name || "No Project Name",
            reservation_id: hit.reservation_id || `RV-${hit.objectID?.slice(-6)}`,
          }))

          setBookings(fetchedBookings)
          setHasMore(searchResults.page < searchResults.nbPages - 1)

          // Create project names map and booking IDs map
          const namesMap: { [productId: string]: string } = {}
          const bookingIdsMap: { [productId: string]: string } = {}
          fetchedBookings.forEach((booking) => {
            if (booking.product_id) {
              namesMap[booking.product_id] = booking.project_name || "No Project Name"
              bookingIdsMap[booking.product_id] = booking.reservation_id || booking.id
            }
          })
          setProjectNames(namesMap)
          setBookingIds(bookingIdsMap)

          const productIds = fetchedBookings
            .map((booking) => booking.product_id)
            .filter((id): id is string => Boolean(id))

          const uniqueProductIds = [...new Set(productIds)]

          // Batch fetch products in chunks of 10 (Firestore limit for 'in' queries)
          const productData: { [key: string]: Product } = {}
          const batchSize = 10

          for (let i = 0; i < uniqueProductIds.length; i += batchSize) {
            const batch = uniqueProductIds.slice(i, i + batchSize)
            try {
              const productsRef = collection(db, "products")
              const productsQuery = query(productsRef, where("__name__", "in", batch))
              const productsSnapshot = await getDocs(productsQuery)

              productsSnapshot.forEach((doc) => {
                productData[doc.id] = { id: doc.id, ...doc.data() } as Product
              })
            } catch (error) {
              console.error(`Error fetching product batch:`, error)
              // Fallback to individual fetches for this batch
              const batchPromises = batch.map(async (productId) => {
                try {
                  const productDoc = await getDoc(doc(db, "products", productId))
                  if (productDoc.exists()) {
                    productData[productId] = { id: productDoc.id, ...productDoc.data() } as Product
                  }
                } catch (err) {
                  console.error(`Error fetching product ${productId}:`, err)
                }
              })
              await Promise.all(batchPromises)
            }
          }

          setProducts(Object.values(productData).filter(p => p.id))

          if (uniqueProductIds.length > 0) {
            await Promise.all([
              fetchJobOrderCounts(uniqueProductIds),
              fetchProductReports(uniqueProductIds)
            ])
          }
        } else {
          // No search term, use Firestore query
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

          // Create project names map and booking IDs map
          const namesMap: { [productId: string]: string } = {}
          const bookingIdsMap: { [productId: string]: string } = {}
          fetchedBookings.forEach((booking) => {
            if (booking.product_id) {
              namesMap[booking.product_id] = booking.project_name || "No Project Name"
              bookingIdsMap[booking.product_id] = booking.reservation_id || booking.id
            }
          })
          setProjectNames(namesMap)
          setBookingIds(bookingIdsMap)

          // Only update lastVisibleDocs if we are moving to a new page
          if (newLastVisible && currentPage === lastVisibleDocs.length) {
            setLastVisibleDocs((prev) => [...prev, newLastVisible])
          }

          const productIds = fetchedBookings
            .map((booking) => booking.product_id)
            .filter((id): id is string => Boolean(id))

          const uniqueProductIds = [...new Set(productIds)]

          // Batch fetch products in chunks of 10 (Firestore limit for 'in' queries)
          const productData: { [key: string]: Product } = {}
          const batchSize = 10

          for (let i = 0; i < uniqueProductIds.length; i += batchSize) {
            const batch = uniqueProductIds.slice(i, i + batchSize)
            try {
              const productsRef = collection(db, "products")
              const productsQuery = query(productsRef, where("__name__", "in", batch))
              const productsSnapshot = await getDocs(productsQuery)

              productsSnapshot.forEach((doc) => {
                productData[doc.id] = { id: doc.id, ...doc.data() } as Product
              })
            } catch (error) {
              console.error(`Error fetching product batch:`, error)
              // Fallback to individual fetches for this batch
              const batchPromises = batch.map(async (productId) => {
                try {
                  const productDoc = await getDoc(doc(db, "products", productId))
                  if (productDoc.exists()) {
                    productData[productId] = { id: productDoc.id, ...productDoc.data() } as Product
                  }
                } catch (err) {
                  console.error(`Error fetching product ${productId}:`, err)
                }
              })
              await Promise.all(batchPromises)
            }
          }

          setProducts(Object.values(productData).filter(p => p.id))

          if (uniqueProductIds.length > 0) {
            await Promise.all([
              fetchJobOrderCounts(uniqueProductIds),
              fetchProductReports(uniqueProductIds)
            ])
          }
        }
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [userData?.company_id, currentPage, itemsPerPage, lastVisibleDocs.length, debouncedSearchTerm])

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">Bulletin Board</h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Search:</label>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <Bell className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
              <Settings className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 md:p-6">
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-[10.32px] shadow-[-1.3755556344985962px_2.7511112689971924px_5.3646674156188965px_-0.6877778172492981px_rgba(0,0,0,0.25)] p-4 min-h-[192px]"
                  >
                    <div className="absolute top-3 right-3">
                      <Skeleton className="w-5 h-5" />
                    </div>

                    <div className="flex items-start gap-3 mb-3">
                      <Skeleton className="w-16 h-16 rounded-md flex-shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>

                    <Skeleton className="h-px w-full mb-3" />

                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-4/5" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : products.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {products.map((product: Product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-[10.32px] shadow-[-1.3755556344985962px_2.7511112689971924px_5.3646674156188965px_-0.6877778172492981px_rgba(0,0,0,0.25)] relative cursor-pointer hover:shadow-lg transition-shadow p-4 min-h-[192px]"
                      onClick={() => {
                        console.log('Clicked product:', product.id, 'latestJoId:', latestJoIds[product.id!])
                        const targetId = latestJoIds[product.id!] || product.id!
                        router.push(`/logistics/bulletin-board/details/${targetId}`)
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Project: ${projectNames[product.id!] || "No Project Name"}, Reservation: ${bookingIds[product.id!] || 'No Reservation'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          if (latestJoIds[product.id!]) {
                            router.push(`/logistics/bulletin-board/details/${latestJoIds[product.id!]}`)
                          }
                        }
                      }}
                    >
                      <div className="absolute top-3 right-3">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.media?.[0]?.url ? (
                            <Image
                              src={product.media[0].url}
                              alt="Product image"
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="w-6 h-6 text-gray-500"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                }
                              }}
                            />
                          ) : (
                            <Camera className="w-6 h-6 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-600 mb-1">
                            {bookingIds[product.id!] ? `${bookingIds[product.id!]}` : 'No Reservation'}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                            {projectNames[product.id!] || "No Project Name"}
                          </h3>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Site:</span>{' '}
                            <span className="truncate block">
                              {product.specs_rental?.location || product.name || "No site"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <hr className="border-gray-200 mb-3" />

                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Latest Activities:</h4>
                        <div className="space-y-1">
                          {productReports[product.id!] && productReports[product.id!].length > 0 ? (
                            productReports[product.id!].slice(0, 3).map((report: Report, index: number) => {
                              const reportDate = report.updated?.toDate ? report.updated.toDate() : new Date(report.updated || report.date || 0)
                              const formattedDate = reportDate.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })

                              return (
                                <div key={report.id} className="text-xs text-gray-600 truncate">
                                  {formattedDate} - {(report.descriptionOfWork || report.description || "No description").substring(0, 40)}{(report.descriptionOfWork || report.description || "").length > 40 ? "..." : ""}
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-xs text-gray-500">No recent activity</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center md:justify-end mt-6">
                <Pagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={products.length}
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
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-[600px] max-h-[80vh] relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setIsDialogOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Job Orders</h2>
              {selectedProduct && (
                <p className="text-sm text-gray-600 mt-1 truncate">
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
                        <h3 className="font-medium text-gray-900 truncate">
                          Job Order #: {jobOrder.joNumber || jobOrder.id.slice(-6)}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ml-2 ${
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

                      {jobOrder.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {jobOrder.description}
                        </p>
                      )}

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