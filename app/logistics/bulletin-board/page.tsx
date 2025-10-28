"use client"

import { Search, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import { useDebounce } from "@/hooks/use-debounce"
import { collection, query, where, orderBy, limit, startAfter, getDocs, doc, getDoc, DocumentData, QueryDocumentSnapshot, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Product } from "@/lib/firebase-service"
import { searchBookings } from "@/lib/algolia-service"
import { getLatestReportsPerBooking } from "@/lib/report-service"
import type { ReportData } from "@/lib/report-service"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { formatTimeAgo, formatDateShort } from "@/lib/utils"

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

  const [projectNames, setProjectNames] = useState<{ [productId: string]: string }>({})
  const [bookingIds, setBookingIds] = useState<{ [productId: string]: string }>({})
  const [reports, setReports] = useState<{ [reservationId: string]: ReportData }>({})
  const [reportsLoading, setReportsLoading] = useState(true)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(9)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const handleNextPage = () => {
    if (currentPage < totalPages) {
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
  }, [debouncedSearchTerm])

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
          const searchResults = await searchBookings(debouncedSearchTerm.trim(), userData.company_id, 0, 1000) // Fetch all results

          if (searchResults.error) {
            console.error("Search error:", searchResults.error)
            setBookings([])
            setProducts([])
            setProjectNames({})
            setBookingIds({})
            setTotalPages(1)
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
          setTotalPages(Math.ceil(fetchedBookings.length / itemsPerPage))

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
        } else {
          // No search term, use Firestore query
          const bookingsRef = collection(db, "booking")
          const bookingsQuery = query(
            bookingsRef,
            where("company_id", "==", userData.company_id),
            where("quotation_id", "!=", null),
            orderBy("created", "desc")
          )

          const querySnapshot = await getDocs(bookingsQuery)
          const fetchedBookings: Booking[] = []

          querySnapshot.docs.forEach((doc) => {
            fetchedBookings.push({ id: doc.id, ...doc.data() })
          })

          setBookings(fetchedBookings)
          setTotalPages(Math.ceil(fetchedBookings.length / itemsPerPage))

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
        }
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [userData?.company_id, debouncedSearchTerm])

  useEffect(() => {
    const fetchReports = async () => {
      if (!userData?.company_id) {
        setReportsLoading(false)
        return
      }

      try {
        setReportsLoading(true)
        const latestReports = await getLatestReportsPerBooking(userData.company_id)
        setReports(latestReports)
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setReportsLoading(false)
      }
    }

    fetchReports()

    // Set up real-time listener for reports
    if (userData?.company_id) {
      const reportsQuery = query(
        collection(db, "reports"),
        where("companyId", "==", userData.company_id),
        orderBy("created", "desc")
      )

      const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
        const latestReports: { [reservationId: string]: ReportData } = {}

        snapshot.docs.forEach((doc) => {
          const data = doc.data()
          const report: ReportData = {
            id: doc.id,
            ...data,
            attachments: Array.isArray(data.attachments) ? data.attachments : [],
          } as ReportData

          // Only keep the latest report for each reservation_id
          if (report.reservation_id && !latestReports[report.reservation_id]) {
            latestReports[report.reservation_id] = report
          }
        })

        setReports(latestReports)
      })

      return () => unsubscribe()
    }
  }, [userData?.company_id])

  const BookingCard = ({ booking, product }: { booking: Booking; product?: Product }) => {
    const report = reports[booking.reservation_id || booking.id]

    return (
      <div className="bg-white rounded-[10px] shadow-[-1px_2px_5px_-0.5px_rgba(0,0,0,0.25)] p-4 relative min-h-[195px]">
        <div className="absolute top-2 right-2 opacity-50">
          <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="9.5" cy="9.5" r="1.5" fill="currentColor"/>
            <circle cx="9.5" cy="4.5" r="1.5" fill="currentColor"/>
            <circle cx="9.5" cy="14.5" r="1.5" fill="currentColor"/>
          </svg>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-shrink-0">
            <div className="w-[75px] h-[76px] bg-gray-400 rounded-[7px] overflow-hidden">
              {product?.media?.[0]?.url && product.media[0].url.trim() !== '' ? (
                product.media[0].isVideo ? (
                  <video
                    src={product.media[0].url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <Image
                    src={product.media[0].url}
                    alt="Site Photo"
                    width={75}
                    height={76}
                    className="w-full h-full object-cover"
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[11px] font-semibold text-center text-black">
                    No<br/>image
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold text-black mb-1">{booking.reservation_id || booking.id}</p>
            <Link href={`/logistics/bulletin-board/${booking.id}`}>
              <p className="text-[24px] font-semibold text-black mb-2 truncate cursor-pointer hover:text-blue-600 transition-colors">
                {projectNames[booking.product_id || ''] || booking.project_name || "No Project Name"}
              </p>
            </Link>
            <p className="text-[14px] font-semibold text-black">
              Site: <span className="font-normal">{product?.name || "Unknown Location"}</span>
            </p>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-3">
          <p className="text-[14px] font-semibold text-black mb-2">Latest Activities:</p>
          {reportsLoading ? (
            <div className="space-y-1 pl-4">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ) : report ? (
            <div className="space-y-1 pl-4">
              <p className="text-[13px] text-black font-light">
                {formatDateShort(report.created)} - {report.descriptionOfWork || report.status}
              </p>
            </div>
          ) : (
            <p className="text-[13px] text-gray-500 pl-4">No Activities yet</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-neutral-50 min-h-screen px-4 py-6">

          <h1 className="text-lg font-bold text-gray-700 mb-4">Bulletin Board</h1>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-700">Search:</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[190px] h-6 px-3 py-1 border border-gray-400 rounded text-sm text-gray-500 bg-white"
              />
            </div>
            <div className="ml-auto flex gap-2 opacity-30">
              <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.5 4.5h14v10h-14zM6.5 1.5v3M12.5 1.5v3M2.5 8.5h14" stroke="currentColor" strokeWidth="1"/>
              </svg>
              <svg width="27" height="27" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="10" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="19" y="1" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="1" y="10" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="10" y="10" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="19" y="10" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="1" y="19" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="10" y="19" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
                <rect x="19" y="19" width="7" height="7" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex-1">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
                      <div className="h-16 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded mb-1"></div>
                      <div className="h-6 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded mb-3"></div>
                      <div className="border-t pt-2">
                        <div className="h-3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : bookings.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-gray-500 text-lg">No Activities yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((booking) => {
                    const product = products.find(p => p.id === booking.product_id);
                    return (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        product={product}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4 pb-4">
                <Pagination
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={Math.min(itemsPerPage, bookings.length - (currentPage - 1) * itemsPerPage)}
                  totalOverall={bookings.length}
                  onNextPage={handleNextPage}
                  onPreviousPage={handlePreviousPage}
                  hasMore={currentPage < totalPages}
                />
              </div>
            )}
          </div>
        </div>
      </div>
  )
}