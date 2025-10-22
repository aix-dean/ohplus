"use client"

import { Search, X } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"

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

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(15)
  const [lastVisibleDocs, setLastVisibleDocs] = useState<QueryDocumentSnapshot<DocumentData>[]>([null as any])
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

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
              <div className="w-5 h-5 text-gray-400" />
              <div className="w-5 h-5 text-gray-400" />
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
                        const booking = bookings.find(b => b.product_id === product.id)
                        if (booking) {
                          router.push(`/logistics/bulletin-board/details/${booking.id}`)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`Project: ${projectNames[product.id!] || "No Project Name"}, Reservation: ${bookingIds[product.id!] || 'No Reservation'}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          const booking = bookings.find(b => b.product_id === product.id)
                          if (booking) {
                            router.push(`/logistics/bulletin-board/details/${booking.id}`)
                          }
                        }
                      }}
                    >
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 text-gray-400" />
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
                            <div className="w-6 h-6 text-gray-500" />
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
    </div>
  )
}