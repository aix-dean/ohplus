import { db, storage } from "./firebase"
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
} from "firebase/firestore"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"
import type { Product, ProductType } from "./types/product"
import type { Client } from "./types/client"
import type { Proposal } from "./types/proposal"
import type { CostEstimate } from "./types/cost-estimate"
import type { Quotation } from "./types/quotation"
import type { JobOrder } from "./types/job-order"
import type { Campaign } from "./types/campaign"
import type { UserData } from "./types/user"
import type { InvitationCode } from "./types/invitation-code"
import type { ServiceAssignment } from "./types/service-assignment"
import type { ServiceReport } from "./types/service-report"
import type { ChatThread, ChatMessage } from "./types/chat"

// --- Firebase Storage Upload Function ---
export const uploadFileToFirebaseStorage = async (file: File, path: string): Promise<string> => {
  const storageRef = ref(storage, `${path}${file.name}`)
  const uploadTask = uploadBytesResumable(storageRef, file)

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        console.log("Upload is " + progress + "% done")
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused")
            break
          case "running":
            console.log("Upload is running")
            break
        }
      },
      (error) => {
        // Handle unsuccessful uploads
        console.error("Firebase upload error:", error)
        reject(error)
      },
      async () => {
        // Handle successful uploads on complete
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(downloadURL)
      },
    )
  })
}

// --- Firebase Firestore Services ---

// Products
export const getProducts = async (
  lastDoc: any = null,
  limitCount = 10,
  searchQuery = "",
  typeFilter: ProductType | "" = "",
) => {
  try {
    const productsRef = collection(db, "products")
    let q

    if (searchQuery) {
      // For simple search, you might need to query based on specific fields
      // Firebase doesn't support full-text search directly.
      // For more advanced search, consider Algolia or a similar service.
      q = query(
        productsRef,
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff"),
        orderBy("name"),
        limit(limitCount),
      )
    } else if (typeFilter) {
      q = query(productsRef, where("type", "==", typeFilter), orderBy("created_at", "desc"), limit(limitCount))
    } else {
      q = query(productsRef, orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const products = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Product),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { products, lastVisible }
  } catch (error) {
    console.error("Error getting products:", error)
    throw error
  }
}

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Product) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting product by ID:", error)
    throw error
  }
}

export const createProduct = async (productData: Omit<Product, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "products"), {
      ...productData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating product:", error)
    throw error
  }
}

export const updateProduct = async (id: string, productData: Partial<Product>) => {
  try {
    const docRef = doc(db, "products", id)
    await updateDoc(docRef, {
      ...productData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating product:", error)
    throw error
  }
}

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, "products", id))
  } catch (error) {
    console.error("Error deleting product:", error)
    throw error
  }
}

// Clients
export const getClients = async (lastDoc: any = null, limitCount = 10, searchQuery = "") => {
  try {
    const clientsRef = collection(db, "clients")
    let q

    if (searchQuery) {
      q = query(
        clientsRef,
        where("name", ">=", searchQuery),
        where("name", "<=", searchQuery + "\uf8ff"),
        orderBy("name"),
        limit(limitCount),
      )
    } else {
      q = query(clientsRef, orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const clients = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Client),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { clients, lastVisible }
  } catch (error) {
    console.error("Error getting clients:", error)
    throw error
  }
}

export const getClientById = async (id: string): Promise<Client | null> => {
  try {
    const docRef = doc(db, "clients", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Client) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting client by ID:", error)
    throw error
  }
}

export const createClient = async (clientData: Omit<Client, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "clients"), {
      ...clientData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating client:", error)
    throw error
  }
}

export const updateClient = async (id: string, clientData: Partial<Client>) => {
  try {
    const docRef = doc(db, "clients", id)
    await updateDoc(docRef, {
      ...clientData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating client:", error)
    throw error
  }
}

export const deleteClient = async (id: string) => {
  try {
    await deleteDoc(doc(db, "clients", id))
  } catch (error) {
    console.error("Error deleting client:", error)
    throw error
  }
}

// Proposals
export const getProposals = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const proposalsRef = collection(db, "proposals")
    let q = query(proposalsRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(proposalsRef, where("created_by", "==", userId), orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const proposals = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Proposal),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { proposals, lastVisible }
  } catch (error) {
    console.error("Error getting proposals:", error)
    throw error
  }
}

export const getProposalById = async (id: string): Promise<Proposal | null> => {
  try {
    const docRef = doc(db, "proposals", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Proposal) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting proposal by ID:", error)
    throw error
  }
}

export const createProposal = async (proposalData: Omit<Proposal, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "proposals"), {
      ...proposalData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating proposal:", error)
    throw error
  }
}

export const updateProposal = async (id: string, proposalData: Partial<Proposal>) => {
  try {
    const docRef = doc(db, "proposals", id)
    await updateDoc(docRef, {
      ...proposalData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating proposal:", error)
    throw error
  }
}

export const deleteProposal = async (id: string) => {
  try {
    await deleteDoc(doc(db, "proposals", id))
  } catch (error) {
    console.error("Error deleting proposal:", error)
    throw error
  }
}

// Cost Estimates
export const getCostEstimates = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const costEstimatesRef = collection(db, "cost_estimates")
    let q = query(costEstimatesRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(costEstimatesRef, where("created_by", "==", userId), orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const costEstimates = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as CostEstimate),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { costEstimates, lastVisible }
  } catch (error) {
    console.error("Error getting cost estimates:", error)
    throw error
  }
}

export const getCostEstimateById = async (id: string): Promise<CostEstimate | null> => {
  try {
    const docRef = doc(db, "cost_estimates", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as CostEstimate) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting cost estimate by ID:", error)
    throw error
  }
}

export const createCostEstimate = async (costEstimateData: Omit<CostEstimate, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "cost_estimates"), {
      ...costEstimateData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating cost estimate:", error)
    throw error
  }
}

export const updateCostEstimate = async (id: string, costEstimateData: Partial<CostEstimate>) => {
  try {
    const docRef = doc(db, "cost_estimates", id)
    await updateDoc(docRef, {
      ...costEstimateData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating cost estimate:", error)
    throw error
  }
}

export const deleteCostEstimate = async (id: string) => {
  try {
    await deleteDoc(doc(db, "cost_estimates", id))
  } catch (error) {
    console.error("Error deleting cost estimate:", error)
    throw error
  }
}

// Quotations
export const getQuotations = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const quotationsRef = collection(db, "quotations")
    let q = query(quotationsRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(quotationsRef, where("created_by", "==", userId), orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const quotations = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Quotation),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { quotations, lastVisible }
  } catch (error) {
    console.error("Error getting quotations:", error)
    throw error
  }
}

export const getQuotationById = async (id: string): Promise<Quotation | null> => {
  try {
    const docRef = doc(db, "quotations", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Quotation) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting quotation by ID:", error)
    throw error
  }
}

export const createQuotation = async (quotationData: Omit<Quotation, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "quotations"), {
      ...quotationData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating quotation:", error)
    throw error
  }
}

export const updateQuotation = async (id: string, quotationData: Partial<Quotation>) => {
  try {
    const docRef = doc(db, "quotations", id)
    await updateDoc(docRef, {
      ...quotationData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating quotation:", error)
    throw error
  }
}

export const deleteQuotation = async (id: string) => {
  try {
    await deleteDoc(doc(db, "quotations", id))
  } catch (error) {
    console.error("Error deleting quotation:", error)
    throw error
  }
}

// Job Orders
export const getJobOrders = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const jobOrdersRef = collection(db, "job_orders")
    let q = query(jobOrdersRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(jobOrdersRef, where("created_by", "==", userId), orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const jobOrders = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as JobOrder),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { jobOrders, lastVisible }
  } catch (error) {
    console.error("Error getting job orders:", error)
    throw error
  }
}

export const getJobOrderById = async (id: string): Promise<JobOrder | null> => {
  try {
    const docRef = doc(db, "job_orders", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as JobOrder) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting job order by ID:", error)
    throw error
  }
}

export const createJobOrder = async (
  jobOrderData: Omit<JobOrder, "id" | "created_at" | "updated_at" | "created_by" | "status">,
  userId: string,
  status: JobOrder["status"],
) => {
  try {
    const docRef = await addDoc(collection(db, "job_orders"), {
      ...jobOrderData,
      created_by: userId,
      status: status,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating job order:", error)
    throw error
  }
}

export const updateJobOrder = async (id: string, jobOrderData: Partial<JobOrder>) => {
  try {
    const docRef = doc(db, "job_orders", id)
    await updateDoc(docRef, {
      ...jobOrderData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating job order:", error)
    throw error
  }
}

export const deleteJobOrder = async (id: string) => {
  try {
    await deleteDoc(doc(db, "job_orders", id))
  } catch (error) {
    console.error("Error deleting job order:", error)
    throw error
  }
}

// Users
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, "users", uid)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...(docSnap.data() as Omit<UserData, "uid">) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user data:", error)
    throw error
  }
}

export const updateUserData = async (uid: string, data: Partial<UserData>) => {
  try {
    const userRef = doc(db, "users", uid)
    await updateDoc(userRef, data)
  } catch (error) {
    console.error("Error updating user data:", error)
    throw error
  }
}

export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, orderBy("first_name"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as Omit<UserData, "uid">) }))
  } catch (error) {
    console.error("Error getting all users:", error)
    throw error
  }
}

// Invitation Codes
export const getInvitationCodes = async (lastDoc: any = null, limitCount = 10) => {
  try {
    const codesRef = collection(db, "invitation_codes")
    let q = query(codesRef, orderBy("created_at", "desc"), limit(limitCount))

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const codes = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as InvitationCode),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { codes, lastVisible }
  } catch (error) {
    console.error("Error getting invitation codes:", error)
    throw error
  }
}

export const getInvitationCodeById = async (id: string): Promise<InvitationCode | null> => {
  try {
    const docRef = doc(db, "invitation_codes", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as InvitationCode) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting invitation code by ID:", error)
    throw error
  }
}

export const getInvitationCodeByCode = async (code: string): Promise<InvitationCode | null> => {
  try {
    const codesRef = collection(db, "invitation_codes")
    const q = query(codesRef, where("code", "==", code), limit(1))
    const querySnapshot = await getDocs(q)
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0]
      return { id: docSnap.id, ...(docSnap.data() as InvitationCode) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting invitation code by code:", error)
    throw error
  }
}

export const createInvitationCode = async (codeData: Omit<InvitationCode, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "invitation_codes"), {
      ...codeData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating invitation code:", error)
    throw error
  }
}

export const updateInvitationCode = async (id: string, codeData: Partial<InvitationCode>) => {
  try {
    const docRef = doc(db, "invitation_codes", id)
    await updateDoc(docRef, {
      ...codeData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating invitation code:", error)
    throw error
  }
}

export const deleteInvitationCode = async (id: string) => {
  try {
    await deleteDoc(doc(db, "invitation_codes", id))
  } catch (error) {
    console.error("Error deleting invitation code:", error)
    throw error
  }
}

// Campaigns
export const getCampaigns = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const campaignsRef = collection(db, "campaigns")
    let q = query(campaignsRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(campaignsRef, where("created_by", "==", userId), orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const campaigns = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Campaign),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { campaigns, lastVisible }
  } catch (error) {
    console.error("Error getting campaigns:", error)
    throw error
  }
}

export const getCampaignById = async (id: string): Promise<Campaign | null> => {
  try {
    const docRef = doc(db, "campaigns", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Campaign) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting campaign by ID:", error)
    throw error
  }
}

export const createCampaign = async (campaignData: Omit<Campaign, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "campaigns"), {
      ...campaignData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating campaign:", error)
    throw error
  }
}

export const updateCampaign = async (id: string, campaignData: Partial<Campaign>) => {
  try {
    const docRef = doc(db, "campaigns", id)
    await updateDoc(docRef, {
      ...campaignData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating campaign:", error)
    throw error
  }
}

export const deleteCampaign = async (id: string) => {
  try {
    await deleteDoc(doc(db, "campaigns", id))
  } catch (error) {
    console.error("Error deleting campaign:", error)
    throw error
  }
}

// Service Assignments
export const getServiceAssignments = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const assignmentsRef = collection(db, "service_assignments")
    let q = query(assignmentsRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(
        assignmentsRef,
        where("assigned_to_uid", "==", userId),
        orderBy("created_at", "desc"),
        limit(limitCount),
      )
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const assignments = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ServiceAssignment),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { assignments, lastVisible }
  } catch (error) {
    console.error("Error getting service assignments:", error)
    throw error
  }
}

export const getServiceAssignmentById = async (id: string): Promise<ServiceAssignment | null> => {
  try {
    const docRef = doc(db, "service_assignments", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as ServiceAssignment) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting service assignment by ID:", error)
    throw error
  }
}

export const createServiceAssignment = async (
  assignmentData: Omit<ServiceAssignment, "id" | "created_at" | "updated_at">,
) => {
  try {
    const docRef = await addDoc(collection(db, "service_assignments"), {
      ...assignmentData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating service assignment:", error)
    throw error
  }
}

export const updateServiceAssignment = async (id: string, assignmentData: Partial<ServiceAssignment>) => {
  try {
    const docRef = doc(db, "service_assignments", id)
    await updateDoc(docRef, {
      ...assignmentData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating service assignment:", error)
    throw error
  }
}

export const deleteServiceAssignment = async (id: string) => {
  try {
    await deleteDoc(doc(db, "service_assignments", id))
  } catch (error) {
    console.error("Error deleting service assignment:", error)
    throw error
  }
}

// Service Reports
export const getServiceReports = async (lastDoc: any = null, limitCount = 10, userId?: string) => {
  try {
    const reportsRef = collection(db, "service_reports")
    let q = query(reportsRef, orderBy("created_at", "desc"), limit(limitCount))

    if (userId) {
      q = query(reportsRef, where("created_by", "==", userId), orderBy("created_at", "desc"), limit(limitCount))
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc))
    }

    const documentSnapshots = await getDocs(q)
    const reports = documentSnapshots.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as ServiceReport),
    }))
    const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1]

    return { reports, lastVisible }
  } catch (error) {
    console.error("Error getting service reports:", error)
    throw error
  }
}

export const getServiceReportById = async (id: string): Promise<ServiceReport | null> => {
  try {
    const docRef = doc(db, "service_reports", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as ServiceReport) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting service report by ID:", error)
    throw error
  }
}

export const createServiceReport = async (reportData: Omit<ServiceReport, "id" | "created_at" | "updated_at">) => {
  try {
    const docRef = await addDoc(collection(db, "service_reports"), {
      ...reportData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating service report:", error)
    throw error
  }
}

export const updateServiceReport = async (id: string, reportData: Partial<ServiceReport>) => {
  try {
    const docRef = doc(db, "service_reports", id)
    await updateDoc(docRef, {
      ...reportData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating service report:", error)
    throw error
  }
}

export const deleteServiceReport = async (id: string) => {
  try {
    await deleteDoc(doc(db, "service_reports", id))
  } catch (error) {
    console.error("Error deleting service report:", error)
    throw error
  }
}

// Helper to get quotation details for job order creation
export const getQuotationDetailsForJobOrder = async (
  quotationId: string,
): Promise<{ quotation: Quotation; product: Product; client: Client | null } | null> => {
  try {
    const quotation = await getQuotationById(quotationId)
    if (!quotation || !quotation.product_id) {
      return null
    }

    const product = await getProductById(quotation.product_id)
    if (!product) {
      return null
    }

    let client: Client | null = null
    if (quotation.client_id) {
      client = await getClientById(quotation.client_id)
    }

    return { quotation, product, client }
  } catch (error) {
    console.error("Error fetching quotation details for job order:", error)
    throw error
  }
}

// Get total count of documents in a collection
export const getCollectionCount = async (collectionName: string, userId?: string): Promise<number> => {
  try {
    let q = collection(db, collectionName)
    if (userId) {
      q = query(q, where("created_by", "==", userId))
    }
    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
  } catch (error) {
    console.error(`Error getting count for collection ${collectionName}:`, error)
    throw error
  }
}

// Get total count of documents in a collection with a specific status
export const getCollectionCountByStatus = async (
  collectionName: string,
  statusField: string,
  statusValue: string,
  userId?: string,
): Promise<number> => {
  try {
    let q = collection(db, collectionName)
    if (userId) {
      q = query(q, where("created_by", "==", userId), where(statusField, "==", statusValue))
    } else {
      q = query(q, where(statusField, "==", statusValue))
    }
    const snapshot = await getCountFromServer(q)
    return snapshot.data().count
  } catch (error) {
    console.error(`Error getting count for collection ${collectionName} with status ${statusValue}:`, error)
    throw error
  }
}

// Chat Threads
export const getChatThreads = async (userId: string): Promise<ChatThread[]> => {
  try {
    const threadsRef = collection(db, "chat_threads")
    const q = query(threadsRef, where("participants", "array-contains", userId), orderBy("updated_at", "desc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ChatThread, "id">) }))
  } catch (error) {
    console.error("Error getting chat threads:", error)
    throw error
  }
}

export const getChatThreadById = async (threadId: string): Promise<ChatThread | null> => {
  try {
    const docRef = doc(db, "chat_threads", threadId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as Omit<ChatThread, "id">) }
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting chat thread by ID:", error)
    throw error
  }
}

export const createChatThread = async (
  threadData: Omit<ChatThread, "id" | "created_at" | "updated_at">,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "chat_threads"), {
      ...threadData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating chat thread:", error)
    throw error
  }
}

export const updateChatThread = async (threadId: string, threadData: Partial<ChatThread>) => {
  try {
    const docRef = doc(db, "chat_threads", threadId)
    await updateDoc(docRef, {
      ...threadData,
      updated_at: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating chat thread:", error)
    throw error
  }
}

// Chat Messages
export const getChatMessages = async (threadId: string): Promise<ChatMessage[]> => {
  try {
    const messagesRef = collection(db, "chat_threads", threadId, "messages")
    const q = query(messagesRef, orderBy("created_at", "asc"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ChatMessage, "id">) }))
  } catch (error) {
    console.error("Error getting chat messages:", error)
    throw error
  }
}

export const addChatMessage = async (
  threadId: string,
  messageData: Omit<ChatMessage, "id" | "created_at">,
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, "chat_threads", threadId, "messages"), {
      ...messageData,
      created_at: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding chat message:", error)
    throw error
  }
}
