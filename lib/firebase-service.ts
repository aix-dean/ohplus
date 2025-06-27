import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  limit,
  startAfter,
  orderBy,
  type DocumentData,
  type QueryDocumentSnapshot,
  getCountFromServer,
  type Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { subscriptionService } from "./subscription-service"

// Initialize Firebase Storage
const storage = getStorage()

// Update the Product interface to include new fields
export interface Product {
  id: string
  name: string
  position: number
  seller_id: string
  seller_name: string
  specs_rental?: {
    audience_type?: string
    audience_types?: string[]
    geopoint: [number, number]
    location?: string
    traffic_count?: number
    elevation?: number
    height?: number
    width?: number
  }
  light?: {
    location: string
    name: string
    operator: string
  }
  terminologies?: any
  status: string
  type: string
  updated: string | Timestamp
  categories?: string[]
  category_id?: string
  category_name?: string
  category_names?: string[]
  contract?: string
  contract_template_id?: number
  created?: string | Timestamp
  description?: string
  media?: {
    distance: string
    isVideo: boolean
    type: string
    url: string
  }[]
  active?: boolean
  ai_logo_tags?: string[]
  ai_text_tags?: string[]
  deleted?: boolean
  date_deleted?: string | Timestamp
  price?: number | string
  content_type?: string
  health_percentage?: number
  site_code?: string
}

// Add this interface after the Product interface
export interface ServiceAssignment {
  id: string
  saNumber: string
  projectSiteId: string
  projectSiteName: string
  projectSiteLocation: string
  serviceType: string
  assignedTo: string
  jobDescription: string
  requestedBy: {
    id: string
    name: string
    department: string
  }
  message: string
  coveredDateStart: Date | null
  coveredDateEnd: Date | null
  alarmDate: Date | null
  alarmTime: string
  attachments: { name: string; type: string }[]
  status: string
  created: any
  updated: any
}

// Add the Booking interface after the ServiceAssignment interface
export interface Booking {
  id: string
  product_id: string
  client_id: string
  client_name: string
  seller_id: string
  start_date: string | Timestamp
  end_date: string | Timestamp
  status: string
  total_amount: number
  payment_status: string
  created: string | Timestamp
  updated: string | Timestamp
  notes?: string
  booking_reference?: string
}

// Add this interface after the Booking interface
export interface User {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  role?: string
  created?: string | Timestamp
  updated?: string | Timestamp
}

// Add the QuotationRequest interface after the User interface
export interface QuotationRequest {
  id: string
  company: string
  company_address: string
  contact_number: string
  created: string | Timestamp
  deleted: boolean
  email_address: string
  end_date: string | Timestamp
  name: string
  position: string
  product_id: string
  product_ref: string
  seller_id: string
  start_date: string | Timestamp
  status: string
  user_id: string
  // Optional fields that might be added later
  notes?: string
  total_amount?: number
  updated?: string | Timestamp
}

// Add the Quotation interface here, consistent with lib/types/quotation.ts
export interface Quotation {
  id?: string
  quotation_number: string
  quotation_request_id?: string
  product_id: string
  product_name: string
  product_location?: string
  site_code?: string
  start_date: string
  end_date: string
  price: number
  total_amount: number
  duration_days: number
  notes?: string
  status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "viewed"
  created: any
  updated?: any
  created_by?: string
  created_by_first_name?: string
  created_by_last_name?: string
  client_name?: string
  client_email?: string
  client_id?: string // Added client_id
  campaignId?: string
  proposalId?: string
  valid_until?: any
}

export interface PaginatedResult<T> {
  items: T[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

// Re-declare ProjectData to include subscription fields, matching AuthContext's ProjectData
export interface ProjectData {
  id: string
  uid: string
  license_key: string
  project_name: string
  company_name: string
  company_location: string
  company_website: string
  social_media: {
    facebook: string
    instagram: string
    youtube: string
  }
  created: string
  updated: string
  deleted: boolean
  tenant_id?: string
}

// Get a single product by ID
export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const productDoc = await getDoc(doc(db, "products", productId))

    if (productDoc.exists()) {
      return { id: productDoc.id, ...productDoc.data() } as Product
    }

    return null
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

// Update an existing product
export async function updateProduct(productId: string, productData: Partial<Product>): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)

    // Add updated timestamp
    const updateData = {
      ...productData,
      updated: serverTimestamp(),
    }

    await updateDoc(productRef, updateData)
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

// Get all products for a user (legacy method)
export async function getUserProducts(userId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const q = query(productsRef, where("seller_id", "==", userId), orderBy("name", "asc"))
    const querySnapshot = await getDocs(q)

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product)
    })

    return products
  } catch (error) {
    console.error("Error fetching user products:", error)
    return []
  }
}

// Get paginated products for a user
export async function getPaginatedUserProducts(
  userId: string,
  itemsPerPage = 16,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  options: { searchTerm?: string; active?: boolean } = {},
): Promise<PaginatedResult<Product>> {
  try {
    const productsRef = collection(db, "products")
    const { searchTerm = "", active } = options

    // Start with basic constraints
    const constraints: any[] = [where("seller_id", "==", userId), orderBy("name", "asc"), limit(itemsPerPage)]

    // Add active filter if specified
    if (active !== undefined) {
      constraints.unshift(where("active", "==", active))
    }

    // Create the query with all constraints
    let q = query(productsRef, ...constraints)

    // If we have a last document, start after it for pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const querySnapshot = await getDocs(q)

    // Get the last visible document for next pagination
    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null

    // Check if there are more documents to fetch
    const hasMore = querySnapshot.docs.length === itemsPerPage

    // Convert the documents to Product objects
    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() } as Product

      // If there's a search term, filter client-side
      if (searchTerm && typeof searchTerm === "string") {
        const searchLower = searchTerm.toLowerCase()
        if (
          product.name?.toLowerCase().includes(searchLower) ||
          product.light?.location?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        ) {
          products.push(product)
        }
      } else {
        products.push(product)
      }
    })

    return {
      items: products,
      lastDoc: lastVisible,
      hasMore,
    }
  } catch (error) {
    console.error("Error fetching paginated user products:", error)
    return {
      items: [],
      lastDoc: null,
      hasMore: false,
    }
  }
}

// Get the total count of products for a user
export async function getUserProductsCount(
  userId: string,
  options: { searchTerm?: string; active?: boolean; deleted?: boolean } = {},
): Promise<number> {
  try {
    const productsRef = collection(db, "products")
    const { searchTerm = "", active, deleted } = options

    // Start with basic constraints
    const constraints: any[] = [where("seller_id", "==", userId)]

    // Add active filter if specified
    if (active !== undefined) {
      constraints.push(where("active", "==", active))
    }
    // Add deleted filter if specified
    if (deleted !== undefined) {
      constraints.push(where("deleted", "==", deleted))
    }

    // Create the query with all constraints
    const q = query(productsRef, ...constraints)

    // If there's a search term, we need to fetch all documents and filter client-side
    if (searchTerm && typeof searchTerm === "string") {
      const querySnapshot = await getDocs(q)
      const searchLower = searchTerm.toLowerCase()

      // Filter documents client-side
      let count = 0
      querySnapshot.forEach((doc) => {
        const product = doc.data() as Product
        if (
          product.name?.toLowerCase().includes(searchLower) ||
          product.light?.location?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        ) {
          count++
        }
      })

      return count
    } else {
      // If no search term, we can use the more efficient getCountFromServer
      const snapshot = await getCountFromServer(q)
      return snapshot.data().count
    }
  } catch (error) {
    console.error("Error getting user products count:", error)
    return 0
  }
}

// Create a new product
export async function createProduct(
  userId: string,
  userName: string,
  licenseKey: string, // Added licenseKey
  productData: Partial<Product>,
): Promise<string> {
  try {
    // Check subscription limits before creating a product
    const subscription = await subscriptionService.getSubscriptionByLicenseKey(licenseKey)
    if (!subscription) {
      throw new Error("No active subscription found for this project.")
    }

    // Get the current count of non-deleted products for the user
    const currentProductsCount = await getUserProductsCount(userId, { deleted: false })

    if (subscription.maxProducts !== null && currentProductsCount >= subscription.maxProducts) {
      throw new Error(`Product limit reached. Your current plan allows up to ${subscription.maxProducts} products.`)
    }

    const newProduct = {
      ...productData,
      seller_id: userId,
      seller_name: userName,
      status: productData.status || "PENDING",
      position: productData.position || 0,
      deleted: productData.deleted !== undefined ? productData.deleted : false, // Ensure deleted field is set
      created: serverTimestamp(), // Set created timestamp here
      updated: serverTimestamp(), // Set updated timestamp here
    }

    const docRef = await addDoc(collection(db, "products"), newProduct)

    return docRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

// Soft delete a product (mark as deleted)
export async function softDeleteProduct(productId: string, licenseKey: string): Promise<void> {
  try {
    const productRef = doc(db, "products", productId)
    await updateDoc(productRef, {
      deleted: true,
      date_deleted: serverTimestamp(),
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error soft deleting product:", error)
    throw error
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products")
    const querySnapshot = await getDocs(productsRef)

    const products: Product[] = []
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() } as Product)
    })

    return products
  } catch (error) {
    console.error("Error fetching all products:", error)
    return []
  }
}

// Search products by term (for more complex search requirements)
export async function searchUserProducts(userId: string, searchTerm: string): Promise<Product[]> {
  try {
    // For simple searches, we can fetch all user products and filter client-side
    // For production with large datasets, consider using Algolia, Elasticsearch, or Firestore's array-contains
    const products = await getUserProducts(userId)

    if (!searchTerm) return products

    const searchLower = searchTerm.toLowerCase()
    return products.filter(
      (product) =>
        product.name?.toLowerCase().includes(searchLower) ||
        product.light?.location?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower),
    )
  } catch (error) {
    console.error("Error searching user products:", error)
    return []
  }
}

// NEW OPTIMIZED FUNCTIONS

// Get products by content type with pagination and filtering
export async function getProductsByContentType(
  contentType: string,
  itemsPerPage = 16,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  searchTerm = "",
): Promise<PaginatedResult<Product>> {
  try {
    const productsRef = collection(db, "products")

    // Create base query - filter out deleted products
    const baseQuery = query(productsRef, where("deleted", "==", false), orderBy("name", "asc"))

    // If search term is provided, we need to handle it differently
    if (searchTerm) {
      // For search, we need to fetch more items and filter client-side
      // This is because Firestore doesn't support case-insensitive search
      const searchQuery = lastDoc
        ? query(baseQuery, startAfter(lastDoc), limit(itemsPerPage * 3)) // Fetch more to account for filtering
        : query(baseQuery, limit(itemsPerPage * 3))

      const querySnapshot = await getDocs(searchQuery)

      // Filter client-side for content_type and search term
      const searchLower = searchTerm.toLowerCase()
      const contentTypeLower = contentType.toLowerCase()

      const filteredDocs = querySnapshot.docs.filter((doc) => {
        const product = doc.data() as Product
        const productContentType = (product.content_type || "").toLowerCase()

        // Check content type match
        if (productContentType !== contentTypeLower) return false

        // Check search term match
        return (
          product.name?.toLowerCase().includes(searchLower) ||
          product.light?.location?.toLowerCase().includes(searchLower) ||
          product.specs_rental?.location?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower)
        )
      })

      // Apply pagination to filtered results
      const paginatedDocs = filteredDocs.slice(0, itemsPerPage)
      const lastVisible = paginatedDocs.length > 0 ? paginatedDocs[paginatedDocs.length - 1] : null

      // Convert to products
      const products = paginatedDocs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product)

      return {
        items: products,
        lastDoc: lastVisible,
        hasMore: filteredDocs.length > itemsPerPage,
      }
    } else {
      // If no search term, we can use a more efficient query
      // Add content_type filter (case insensitive is handled client-side)
      // Note: For case-insensitive search, consider adding lowercase fields to your documents
      const paginatedQuery = lastDoc
        ? query(baseQuery, limit(itemsPerPage * 2), startAfter(lastDoc))
        : query(baseQuery, limit(itemsPerPage * 2))

      const querySnapshot = await getDocs(paginatedQuery)

      // Filter for content_type (case insensitive)
      const contentTypeLower = contentType.toLowerCase()
      const filteredDocs = querySnapshot.docs.filter((doc) => {
        const product = doc.data() as Product
        const productContentType = (product.content_type || "").toLowerCase()
        return productContentType === contentTypeLower
      })

      // Apply pagination to filtered results
      const paginatedDocs = filteredDocs.slice(0, itemsPerPage)
      const lastVisible = paginatedDocs.length > 0 ? paginatedDocs[paginatedDocs.length - 1] : null

      // Convert to products
      const products = paginatedDocs.map((doc) => ({ id: doc.id, ...doc.data() }) as Product)

      return {
        items: products,
        lastDoc: lastVisible,
        hasMore: filteredDocs.length > itemsPerPage,
      }
    }
  } catch (error) {
    console.error(`Error fetching products by content type (${contentType}):`, error)
    return {
      items: [],
      lastDoc: null,
      hasMore: false,
    }
  }
}

// Get count of products by content type
export async function getProductsCountByContentType(contentType: string, searchTerm = ""): Promise<number> {
  try {
    const productsRef = collection(db, "products")

    // Create base query - filter out deleted products
    const baseQuery = query(productsRef, where("deleted", "==", false))

    const querySnapshot = await getDocs(baseQuery)

    // Filter for content_type and search term
    const contentTypeLower = contentType.toLowerCase()
    let count = 0

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()

      querySnapshot.forEach((doc) => {
        const product = doc.data() as Product
        const productContentType = (product.content_type || "").toLowerCase()

        if (productContentType === contentTypeLower) {
          if (
            product.name?.toLowerCase().includes(searchLower) ||
            product.light?.location?.toLowerCase().includes(searchLower) ||
            product.specs_rental?.location?.toLowerCase().includes(searchLower) ||
            product.description?.toLowerCase().includes(searchLower)
          ) {
            count++
          }
        }
      })
    } else {
      querySnapshot.forEach((doc) => {
        const product = doc.data() as Product
        const productContentType = (product.content_type || "").toLowerCase()

        if (productContentType === contentTypeLower) {
          count++
        }
      })
    }

    return count
  } catch (error) {
    console.error(`Error getting count of products by content type (${contentType}):`, error)
    return 0
  }
}

// Add these functions at the end of the file
export async function getServiceAssignments(): Promise<ServiceAssignment[]> {
  try {
    const assignmentsRef = collection(db, "service_assignments")
    const querySnapshot = await getDocs(assignmentsRef)

    const assignments: ServiceAssignment[] = []
    querySnapshot.forEach((doc) => {
      assignments.push({ id: doc.id, ...doc.data() } as ServiceAssignment)
    })

    return assignments
  } catch (error) {
    console.error("Error fetching service assignments:", error)
    return []
  }
}

export async function getServiceAssignmentById(assignmentId: string): Promise<ServiceAssignment | null> {
  try {
    const assignmentDoc = await getDoc(doc(db, "service_assignments", assignmentId))

    if (assignmentDoc.exists()) {
      return { id: assignmentDoc.id, ...assignmentDoc.data() } as ServiceAssignment
    }

    return null
  } catch (error) {
    console.error("Error fetching service assignment:", error)
    return null
  }
}

export async function updateServiceAssignment(
  assignmentId: string,
  assignmentData: Partial<ServiceAssignment>,
): Promise<void> {
  try {
    const assignmentRef = doc(db, "service_assignments", assignmentId)

    // Add updated timestamp
    const updateData = {
      ...assignmentData,
      updated: serverTimestamp(),
    }

    await updateDoc(assignmentRef, updateData)
  } catch (error) {
    console.error("Error updating service assignment:", error)
    throw error
  }
}

// Add this function at the end of the file
export async function getProductBookings(productId: string): Promise<Booking[]> {
  try {
    const bookingsRef = collection(db, "booking")
    const q = query(bookingsRef, where("product_id", "==", productId), orderBy("created", "desc"))

    const querySnapshot = await getDocs(q)

    const bookings: Booking[] = []
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking)
    })

    return bookings
  } catch (error) {
    console.error("Error fetching product bookings:", error)
    return []
  }
}

// Add this function at the end of the file
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", userId))

    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as User
    }

    return null
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

// Update this function to make status filtering case-insensitive
export async function getServiceAssignmentsByProductId(productId: string): Promise<ServiceAssignment[]> {
  try {
    const assignmentsRef = collection(db, "service_assignments")

    // Only filter by productId in the Firestore query
    const q = query(assignmentsRef, where("projectSiteId", "==", productId))

    const querySnapshot = await getDocs(q)

    // Filter by status case-insensitively on the client side
    const assignments: ServiceAssignment[] = []
    querySnapshot.forEach((doc) => {
      const assignment = { id: doc.id, ...doc.data() } as ServiceAssignment

      // Case-insensitive status check
      const status = assignment.status?.toLowerCase() || ""
      if (status === "ongoing" || status === "pending") {
        assignments.push(assignment)
      }
    })

    return assignments
  } catch (error) {
    console.error(`Error fetching service assignments for product ${productId}:`, error)
    return []
  }
}

// QUOTATION REQUEST FUNCTIONS

// Get all quotation requests
export async function getQuotationRequests(): Promise<QuotationRequest[]> {
  try {
    const quotationRequestsRef = collection(db, "quotation_request")
    const q = query(quotationRequestsRef, where("deleted", "==", false), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const quotationRequests: QuotationRequest[] = []
    querySnapshot.forEach((doc) => {
      quotationRequests.push({ id: doc.id, ...doc.data() } as QuotationRequest)
    })

    return quotationRequests
  } catch (error) {
    console.error("Error fetching quotation requests:", error)
    return []
  }
}

// Get quotation requests by seller ID
export async function getQuotationRequestsBySellerId(sellerId: string): Promise<QuotationRequest[]> {
  try {
    const quotationRequestsRef = collection(db, "quotation_request")
    const q = query(
      quotationRequestsRef,
      where("seller_id", "==", sellerId),
      where("deleted", "==", false),
      orderBy("created", "desc"),
    )
    const querySnapshot = await getDocs(q)

    const quotationRequests: QuotationRequest[] = []
    querySnapshot.forEach((doc) => {
      quotationRequests.push({ id: doc.id, ...doc.data() } as QuotationRequest)
    })

    return quotationRequests
  } catch (error) {
    console.error("Error fetching quotation requests by seller ID:", error)
    return []
  }
}

// Get quotation requests by product ID
export async function getQuotationRequestsByProductId(productId: string): Promise<QuotationRequest[]> {
  try {
    const quotationRequestsRef = collection(db, "quotation_request")
    const q = query(
      quotationRequestsRef,
      where("product_id", "==", productId),
      where("deleted", "==", false),
      orderBy("created", "desc"),
    )
    const querySnapshot = await getDocs(q)

    const quotationRequests: QuotationRequest[] = []
    querySnapshot.forEach((doc) => {
      quotationRequests.push({ id: doc.id, ...doc.data() } as QuotationRequest)
    })

    return quotationRequests
  } catch (error) {
    console.error("Error fetching quotation requests by product ID:", error)
    return []
  }
}

// Get quotation requests with pagination
export async function getPaginatedQuotationRequests(
  itemsPerPage = 20,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  options: {
    sellerId?: string
    status?: string
    searchTerm?: string
  } = {},
): Promise<PaginatedResult<QuotationRequest>> {
  try {
    const quotationRequestsRef = collection(db, "quotation_request")
    const { sellerId, status, searchTerm = "" } = options

    // Start with basic constraints
    const constraints: any[] = [where("deleted", "==", false), orderBy("created", "desc"), limit(itemsPerPage)]

    // Add seller filter if specified
    if (sellerId) {
      constraints.unshift(where("seller_id", "==", sellerId))
    }

    // Add status filter if specified
    if (status && status !== "all") {
      constraints.unshift(where("status", "==", status.toUpperCase()))
    }

    // Create the query with all constraints
    let q = query(quotationRequestsRef, ...constraints)

    // If we have a last document, start after it for pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const querySnapshot = await getDocs(q)

    // Get the last visible document for next pagination
    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null

    // Check if there are more documents to fetch
    const hasMore = querySnapshot.docs.length === itemsPerPage

    // Convert the documents to QuotationRequest objects
    const quotationRequests: QuotationRequest[] = []
    querySnapshot.forEach((doc) => {
      const quotationRequest = { id: doc.id, ...doc.data() } as QuotationRequest

      // If there's a search term, filter client-side
      if (searchTerm && typeof searchTerm === "string") {
        const searchLower = searchTerm.toLowerCase()
        if (
          quotationRequest.name?.toLowerCase().includes(searchLower) ||
          quotationRequest.company?.toLowerCase().includes(searchLower) ||
          quotationRequest.email_address?.toLowerCase().includes(searchLower) ||
          quotationRequest.contact_number?.includes(searchTerm)
        ) {
          quotationRequests.push(quotationRequest)
        }
      } else {
        quotationRequests.push(quotationRequest)
      }
    })

    return {
      items: quotationRequests,
      lastDoc: lastVisible,
      hasMore,
    }
  } catch (error) {
    console.error("Error fetching paginated quotation requests:", error)
    return {
      items: [],
      lastDoc: null,
      hasMore: false,
    }
  }
}

// Get a single quotation request by ID
export async function getQuotationRequestById(quotationRequestId: string): Promise<QuotationRequest | null> {
  try {
    const quotationRequestDoc = await getDoc(doc(db, "quotation_request", quotationRequestId))

    if (quotationRequestDoc.exists()) {
      return { id: quotationRequestDoc.id, ...quotationRequestDoc.data() } as QuotationRequest
    }

    return null
  } catch (error) {
    console.error("Error fetching quotation request:", error)
    return null
  }
}

// Update a quotation request
export async function updateQuotationRequest(
  quotationRequestId: string,
  quotationRequestData: Partial<QuotationRequest>,
): Promise<void> {
  try {
    const quotationRequestRef = doc(db, "quotation_request", quotationRequestId)

    // Add updated timestamp
    const updateData = {
      ...quotationRequestData,
      updated: serverTimestamp(),
    }

    await updateDoc(quotationRequestRef, updateData)
  } catch (error) {
    console.error("Error updating quotation request:", error)
    throw error
  }
}

// Create a new quotation request
export async function createQuotationRequest(quotationRequestData: Partial<QuotationRequest>): Promise<string> {
  try {
    const newQuotationRequest = {
      ...quotationRequestData,
      created: serverTimestamp(),
      deleted: false,
      status: quotationRequestData.status || "PENDING",
    }

    const docRef = await addDoc(collection(db, "quotation_request"), newQuotationRequest)
    return docRef.id
  } catch (error) {
    console.error("Error creating quotation request:", error)
    throw error
  }
}

// Soft delete a quotation request
export async function softDeleteQuotationRequest(quotationRequestId: string): Promise<void> {
  try {
    const quotationRequestRef = doc(db, "quotation_request", quotationRequestId)
    await updateDoc(quotationRequestRef, {
      deleted: true,
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error soft deleting quotation request:", error)
    throw error
  }
}

// Get quotations by quotation request ID
export async function getQuotationsByRequestId(quotationRequestId: string): Promise<any[]> {
  try {
    const quotationsRef = collection(db, "quotations")
    const q = query(quotationsRef, where("quotation_request_id", "==", quotationRequestId), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const quotations: any[] = []
    querySnapshot.forEach((doc) => {
      quotations.push({ id: doc.id, ...doc.data() })
    })

    return quotations
  } catch (error) {
    console.error("Error fetching quotations by request ID:", error)
    return []
  }
}

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in Firebase Storage (e.g., "company_logos/").
 * @returns The download URL of the uploaded file.
 */
export async function uploadFileToFirebaseStorage(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, `${path}${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log("File uploaded successfully:", downloadURL)
    return downloadURL
  } catch (error) {
    console.error("Error uploading file to Firebase Storage:", error)
    throw error
  }
}
