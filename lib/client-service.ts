import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
  getCountFromServer,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface Client {
  id: string
  name: string
  email: string
  phone: string
  company: string
  company_id?: string // Make sure this field is included
  designation?: string
  address?: string // Make this optional to match the form
  city?: string
  state?: string
  zipCode?: string
  industry?: string // Make this optional to match the form
  notes?: string
  status: "active" | "inactive" | "lead"
  companyLogoUrl?: string
  uploadedBy?: string
  uploadedByName?: string
  created: any
  updated: any
}

export interface PaginatedResult<T> {
  items: T[]
  lastDoc: QueryDocumentSnapshot<DocumentData> | null
  hasMore: boolean
}

// Get a single client by ID
export async function getClientById(clientId: string): Promise<Client | null> {
  try {
    console.log("Getting client by ID:", clientId)
    const clientDoc = await getDoc(doc(db, "client_db", clientId))

    if (clientDoc.exists()) {
      return { id: clientDoc.id, ...clientDoc.data() } as Client
    }

    return null
  } catch (error) {
    console.error("Error fetching client:", error)
    return null
  }
}

// Create a new client
export async function createClient(clientData: Omit<Client, "id" | "created" | "updated">): Promise<string> {
  try {
    console.log("Creating new client:", clientData)
    const newClient = {
      name: clientData.name,
      email: clientData.email,
      phone: clientData.phone,
      company: clientData.company,
      company_id: clientData.company_id || "",
      designation: clientData.designation || "",
      address: clientData.address || "",
      city: clientData.city || "",
      state: clientData.state || "",
      zipCode: clientData.zipCode || "",
      industry: clientData.industry || "",
      notes: clientData.notes || "",
      status: clientData.status,
      companyLogoUrl: clientData.companyLogoUrl || "",
      uploadedBy: clientData.uploadedBy || "",
      uploadedByName: clientData.uploadedByName || "",
      created: serverTimestamp(),
      updated: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "client_db"), newClient)
    console.log("Client created with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error creating client:", error)
    throw error
  }
}

// Update an existing client
export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<void> {
  try {
    console.log("Updating client:", clientId, clientData)
    const clientRef = doc(db, "client_db", clientId)

    const updateData = {
      ...clientData,
      updated: serverTimestamp(),
    }

    // Remove undefined values to avoid Firestore errors
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key]
      }
    })

    await updateDoc(clientRef, updateData)
    console.log("Client updated successfully")
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

// Delete a client
export async function deleteClient(clientId: string): Promise<void> {
  try {
    console.log("Deleting client:", clientId)
    await deleteDoc(doc(db, "client_db", clientId))
    console.log("Client deleted successfully")
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}

// Get paginated clients
export async function getPaginatedClients(
  itemsPerPage = 10,
  lastDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  searchTerm = "",
  statusFilter: string | null = null,
  uploadedByFilter: string | null = null, // New filter parameter
): Promise<PaginatedResult<Client>> {
  try {
    console.log("Getting paginated clients:", {
      itemsPerPage,
      lastDoc: !!lastDoc,
      searchTerm,
      statusFilter,
      uploadedByFilter,
    })
    const clientsRef = collection(db, "client_db")

    // Start with base query
    let baseQuery = query(clientsRef, orderBy("name", "asc"))

    // Add status filter if provided
    if (statusFilter) {
      baseQuery = query(baseQuery, where("status", "==", statusFilter))
    }

    // Add uploadedBy filter if provided
    if (uploadedByFilter) {
      baseQuery = query(baseQuery, where("uploadedBy", "==", uploadedByFilter))
    }

    // Add pagination
    const paginatedQuery = lastDoc
      ? query(baseQuery, startAfter(lastDoc), limit(itemsPerPage))
      : query(baseQuery, limit(itemsPerPage))

    const querySnapshot = await getDocs(paginatedQuery)
    console.log("Query returned documents:", querySnapshot.docs.length)

    // Get the last visible document for next pagination
    const lastVisible = querySnapshot.docs.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null

    // Check if there are more documents to fetch
    const hasMore = querySnapshot.docs.length === itemsPerPage

    // Convert the documents to Client objects
    const clients: Client[] = []
    querySnapshot.forEach((doc) => {
      const client = { id: doc.id, ...doc.data() } as Client

      // If there's a search term, filter client-side
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (
          client.name?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.company?.toLowerCase().includes(searchLower) ||
          client.phone?.includes(searchTerm)
        ) {
          clients.push(client)
        }
      } else {
        clients.push(client)
      }
    })

    console.log("Filtered clients:", clients.length)
    return {
      items: clients,
      lastDoc: lastVisible,
      hasMore,
    }
  } catch (error) {
    console.error("Error fetching paginated clients:", error)
    return {
      items: [],
      lastDoc: null,
      hasMore: false,
    }
  }
}

// Get the total count of clients
export async function getClientsCount(
  searchTerm = "",
  statusFilter: string | null = null,
  uploadedByFilter: string | null = null, // New filter parameter
): Promise<number> {
  try {
    console.log("Getting clients count:", { searchTerm, statusFilter, uploadedByFilter })
    const clientsRef = collection(db, "client_db")

    // Start with base query
    let baseQuery: any = clientsRef

    // Add status filter if provided
    if (statusFilter) {
      baseQuery = query(baseQuery, where("status", "==", statusFilter))
    }

    // Add uploadedBy filter if provided
    if (uploadedByFilter) {
      baseQuery = query(baseQuery, where("uploadedBy", "==", uploadedByFilter))
    }

    // If there's a search term, we need to fetch all documents and filter client-side
    if (searchTerm) {
      const querySnapshot = await getDocs(query(baseQuery))
      const searchLower = searchTerm.toLowerCase()

      // Filter documents client-side
      let count = 0
      querySnapshot.forEach((doc) => {
        const client = doc.data() as Client
        if (
          client.name?.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.company?.toLowerCase().includes(searchLower) ||
          client.phone?.includes(searchTerm)
        ) {
          count++
        }
      })

      console.log("Filtered count:", count)
      return count
    } else {
      // If no search term, we can use the more efficient getCountFromServer
      const snapshot = await getCountFromServer(query(baseQuery))
      console.log("Total count:", snapshot.data().count)
      return snapshot.data().count
    }
  } catch (error) {
    console.error("Error getting clients count:", error)
    return 0
  }
}

// Add the following function to the end of the file, before `getAllClients`:

export async function getClientByEmail(email: string): Promise<Client | null> {
  try {
    console.log("Getting client by email:", email)
    const clientsRef = collection(db, "client_db")
    const q = query(clientsRef, where("email", "==", email), limit(1))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0]
      return { id: doc.id, ...doc.data() } as Client
    }

    return null
  } catch (error) {
    console.error("Error fetching client by email:", error)
    return null
  }
}

// Get all clients (without pagination)
export async function getAllClients(): Promise<Client[]> {
  try {
    console.log("Getting all clients")
    const clientsRef = collection(db, "client_db")
    const q = query(clientsRef, orderBy("name", "asc"))
    const querySnapshot = await getDocs(q)

    const clients: Client[] = []
    querySnapshot.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() } as Client)
    })

    console.log("Retrieved all clients:", clients.length)
    return clients
  } catch (error) {
    console.error("Error fetching all clients:", error)
    return []
  }
}
