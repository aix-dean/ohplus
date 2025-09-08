"use client"

import { useState, useEffect, useRef } from "react" // Import useRef
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Search, Printer, Plus, FileText, Upload, X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore" // Import updateDoc, collection, query, where, getDocs
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Toaster } from "sonner"
import { uploadFileToFirebaseStorage } from "@/lib/firebase-service" // Import the upload function

interface Company {
  id: string
  name: string
  address?: string
  industry?: string
  clientType: string
  partnerType?: string
  companyLogoUrl?: string
  contactPersons?: Array<{
    name: string
    email: string
    phone: string
    position: string
  }>
  compliance?: {
    dti?: string;
    gis?: string;
    id?: string;
    uploadedAt?: Date;
    uploadedBy?: string;
  };
}

interface Proposal {
  id: string
  proposalNumber: string
  title: string
  date: string // This will be derived from createdAt
  sites: number // This will be derived from products array length
  sentTo: string // This will be derived from client.email or similar
  status: string
  totalAmount: number
  validUntil: string // This will be derived from validUntil
}

interface CostEstimate {
  id: string;
  costEstimateNumber: string;
  title: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
}

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  total_amount: number;
  status: string;
  created: Date;
  valid_until: Date;
  start_date: string;
  end_date: string;
  duration_days: number;
  items: Array<{ name: string; location: string }>; // To get site information
  projectCompliance: {
    signedQuotation: {
      status: string;
    };
  };
}
 
 interface Booking {
  id: string;
  cancel_reason: string;
  category_id: string;
  client: {
    company_id: string;
    id: string;
  };
  company_id: string;
  contract: string;
  cost: number;
  costDetails: {
    basePrice: number;
    days: number;
    discount: number;
    months: number;
    otherFees: number;
    pricePerMonth: number;
    total: number;
    vatAmount: number;
    vatRate: number;
  };
  created: Date;
  end_date: string;
  media_order: string[];
  payment_method: string;
  product_id: string;
  product_owner: string;
  promos: {
    quotation_id: string;
    rated: boolean;
  };
  requirements: Array<{
    description: string;
    fileName: string;
    fileUrl: string;
    required: boolean;
    title: string;
    type: string;
    uploadStatus: string;
  }>;
  seller_id: string;
  start_date: string;
  status: string;
  total_cost: number;
  type: string;
  updated: Date;
  user_id: string;
}
 
 export default function ClientInformationPage() {
   const router = useRouter()
   const params = useParams()
   const { userData } = useAuth()
   const clientId = params.id as string
 
   const [company, setCompany] = useState<Company | null>(null)
   const [proposals, setProposals] = useState<Proposal[]>([])
   const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([])
   const [quotations, setQuotations] = useState<Quotation[]>([])
   const [bookings, setBookings] = useState<Booking[]>([]) // Add bookings state
   const [loading, setLoading] = useState(true)
   const [activeTab, setActiveTab] = useState("proposals")
   const [searchTerm, setSearchTerm] = useState("")
   const [showComplianceDialog, setShowComplianceDialog] = useState(false)
   const [uploadingDocument, setUploadingDocument] = useState<string | null>(null) // To track which document is being uploaded

  // Refs for hidden file inputs
  const dtiBirFileInputRef = useRef<HTMLInputElement>(null)
  const gisFileInputRef = useRef<HTMLInputElement>(null)
  const idSignatureFileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (clientId && userData?.company_id) {
      loadClientData()
      loadProposals()
      loadCostEstimates()
      loadQuotations()
      loadBookings() // Load bookings
      console.log("Calling loadBookings in useEffect"); // Log for useEffect
    }
  }, [clientId, userData?.company_id])

  const loadCostEstimates = async () => {
    try {
      const costEstimatesCollectionRef = collection(db, "cost_estimates")
      const q = query(costEstimatesCollectionRef, where("client.company_id", "==", clientId))
      const querySnapshot = await getDocs(q)

      const fetchedCostEstimates: CostEstimate[] = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          costEstimateNumber: data.costEstimateNumber || "",
          title: data.title || "",
          startDate: data.startDate
            ? new Date(data.startDate.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          endDate: data.endDate
            ? new Date(data.endDate.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          totalAmount: data.totalAmount || 0,
          status: data.status || "",
        }
      })
      setCostEstimates(fetchedCostEstimates)
    } catch (error) {
      console.error("Error loading cost estimates:", error)
      toast.error("Failed to load cost estimates")
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async () => {
    try {
      const docRef = doc(db, "client_company", clientId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        setCompany({
          id: docSnap.id,
          name: data.name || "",
          address: data.address || "",
          industry: data.industry || "",
          clientType: data.clientType || "",
          partnerType: data.partnerType || "",
          companyLogoUrl: data.companyLogoUrl || "",
          contactPersons: data.contactPersons || [],
          compliance: {
            dti: data.compliance?.dti || "",
            gis: data.compliance?.gis || "",
            id: data.compliance?.id || "",
            uploadedAt: data.compliance?.uploadedAt?.toDate(),
            uploadedBy: data.compliance?.uploadedBy || "",
          },
        })
      } else {
        toast.error("Client not found")
        router.push("/sales/clients")
      }
    } catch (error) {
      console.error("Error loading client data:", error)
      toast.error("Failed to load client data")
    } finally {
      setLoading(false)
    }
  }

  const loadProposals = async () => {
    try {
      const proposalsCollectionRef = collection(db, "proposals")
      const q = query(proposalsCollectionRef, where("client.company_id", "==", clientId))
      const querySnapshot = await getDocs(q)

      const fetchedProposals: Proposal[] = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          proposalNumber: data.proposalNumber || "",
          title: data.title || "",
          date: data.createdAt
            ? new Date(data.createdAt.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          sites: data.products?.length || 0,
          sentTo: data.client?.email || "",
          status: data.status || "",
          totalAmount: data.totalAmount || 0,
          validUntil: data.validUntil ? new Date(data.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "",
        }
      })
      setProposals(fetchedProposals)
    } catch (error) {
      console.error("Error loading proposals:", error)
      toast.error("Failed to load proposals")
    } finally {
      setLoading(false)
    }
  }

  const loadQuotations = async () => {
    try {
      const quotationsCollectionRef = collection(db, "quotations")
      const q = query(quotationsCollectionRef, where("client_company_id", "==", clientId))
      const querySnapshot = await getDocs(q)

      const fetchedQuotations: Quotation[] = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        
        return {
          id: doc.id,
          quotation_number: data.quotation_number || "",
          client_name: data.client_name || "",
          total_amount: data.total_amount || 0,
          status: data.status || "",
          created: data.created ? data.created.toDate() : new Date(),
          valid_until: data.valid_until ? data.valid_until.toDate() : new Date(),
          start_date: data.start_date || "",
          end_date: data.end_date || "",
          duration_days: data.duration_days || 0,
          items: data.items || [],
          projectCompliance: data.projectCompliance || { signedQuotation: { status: "pending" } },
        }
      })
      console.log(`Quotations for client:`, fetchedQuotations); // Log for quotations
      setQuotations(fetchedQuotations)
    } catch (error) {
      console.error("Error loading quotations:", error)
      toast.error("Failed to load quotations")
    } finally {
      setLoading(false)
    }
  }
 
  const loadBookings = async () => {
    try {
      const bookingsCollectionRef = collection(db, "booking")
      const q = query(bookingsCollectionRef, where("client.company_id", "==", clientId))
      const querySnapshot = await getDocs(q)
 
      const fetchedBookings: Booking[] = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          cancel_reason: data.cancel_reason || "",
          category_id: data.category_id || "",
          client: data.client || { company_id: "", id: "" },
          company_id: data.company_id || "",
          contract: data.contract || "",
          cost: data.cost || 0,
          costDetails: data.costDetails || {
            basePrice: 0,
            days: 0,
            discount: 0,
            months: 0,
            otherFees: 0,
            pricePerMonth: 0,
            total: 0,
            vatAmount: 0,
            vatRate: 0,
          },
          created: data.created ? data.created.toDate() : new Date(),
          end_date: data.end_date
            ? new Date(data.end_date.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          media_order: data.media_order || [],
          payment_method: data.payment_method || "",
          product_id: data.product_id || "",
          product_owner: data.product_owner || "",
          promos: data.promos || { quotation_id: "", rated: false },
          requirements: data.requirements || [],
          seller_id: data.seller_id || "",
          start_date: data.start_date
            ? new Date(data.start_date.toDate()).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "",
          status: data.status || "",
          total_cost: data.total_cost || 0,
          type: data.type || "",
          updated: data.updated ? data.updated.toDate() : new Date(),
          user_id: data.user_id || "",
        }
      })
      console.log(`Bookings for client:`, fetchedBookings); // Log for bookings
      setBookings(fetchedBookings)
    } catch (error) {
      console.error("Error loading bookings:", error)
      toast.error("Failed to load bookings")
    } finally {
      setLoading(false)
    }
  }
 
   const getStatusBadge = (status: string) => {
     const statusColors = {
       "Open Inquiry": "bg-gray-100 text-gray-800",
       "For Cost Estimate": "bg-green-100 text-green-800",
       Approved: "bg-blue-100 text-blue-800",
       Rejected: "bg-red-100 text-red-800",
       COMPLETED: "bg-green-500 text-white", // Added for bookings
       CANCELLED: "bg-red-500 text-white", // Added for bookings
       PENDING: "bg-yellow-500 text-white", // Added for bookings
       Ongoing: "bg-gray-500 text-white", // Added for bookings
       Done: "bg-green-500 text-white", // Added for bookings
     }
 
     return (
       <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
         {status}
       </Badge>
     )
   }
 
   const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentKey: 'dti' | 'gis' | 'id') => {
     const file = e.target.files?.[0]
     if (!file || !company || !userData?.uid) {
       toast.error("No file selected or user not authenticated.")
       return
     }
 
     setUploadingDocument(documentKey)
     try {
       const uploadPath = `compliance_documents/${company.id}/${documentKey}/`
       const downloadUrl = await uploadFileToFirebaseStorage(file, uploadPath)
 
       const companyRef = doc(db, "client_company", company.id)
       await updateDoc(companyRef, {
         [`compliance.${documentKey}`]: downloadUrl,
         'compliance.uploadedAt': new Date(),
         'compliance.uploadedBy': userData.uid,
       })
 
       setCompany((prev) => {
         if (!prev) return null
         return {
           ...prev,
           compliance: {
             ...prev.compliance,
             [documentKey]: downloadUrl,
             uploadedAt: new Date(),
             uploadedBy: userData.uid,
           },
         }
       })
       toast.success(`${documentKey.toUpperCase()} uploaded successfully!`)
     } catch (error) {
       console.error(`Error uploading ${documentKey}:`, error)
       toast.error(`Failed to upload ${documentKey.toUpperCase()}.`)
     } finally {
       setUploadingDocument(null)
       // Clear the file input value to allow re-uploading the same file
       e.target.value = ""
     }
   }
 
   const triggerFileInput = (ref: React.RefObject<HTMLInputElement | null>) => {
     if (ref.current) {
       ref.current.click()
     }
   }
 
   const filteredProposals = proposals.filter(
     (proposal) =>
     (proposal.proposalNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       proposal.title?.toLowerCase().includes(searchTerm.toLowerCase())),
   )
 
   const filteredBookings = bookings.filter( // Added for bookings
    (booking) =>
      booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.product_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );
 
   if (loading) {
     return (
       <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
         <div className="space-y-6">
           <Skeleton className="h-8 w-64" />
           <Card className="p-6">
             <div className="flex items-start space-x-4">
               <Skeleton className="w-20 h-20 rounded-lg" />
               <div className="space-y-2 flex-1">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-4 w-32" />
                 <Skeleton className="h-4 w-64" />
                 <Skeleton className="h-4 w-56" />
               </div>
             </div>
           </Card>
         </div>
       </div>
     )
   }
 
   if (!company) {
     return (
       <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
         <div className="text-center py-12">
           <p className="text-gray-500">Client not found</p>
           <Button onClick={() => router.push("/sales/clients")} className="mt-4">
             Back to Clients
           </Button>
         </div>
       </div>
     )
   }
 
   const primaryContact = company.contactPersons?.[0]
 
   return (
     <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
       <Toaster />
 
       {/* Header */}
       <div className="flex items-center justify-between mb-6">
         <div className="flex items-center space-x-4">
           <Button variant="ghost" size="icon" onClick={() => router.push("/sales/clients")} className="h-8 w-8">
             <ArrowLeft className="h-4 w-4" />
           </Button>
           <h1 className="text-2xl font-bold text-gray-900">Client Information</h1>
         </div>
         <Button variant="ghost" size="icon" className="h-8 w-8">
           <Edit className="h-4 w-4" />
         </Button>
       </div>
 
       {/* Client Information Card */}
       <Card className="mb-6">
         <CardContent className="p-6">
           <div className="flex items-start justify-between">
             <div className="flex items-start space-x-4">
               <div className="w-20 h-20 rounded-lg overflow-hidden bg-red-500 flex items-center justify-center">
                 {company.companyLogoUrl ? (
                   <img
                     src={company.companyLogoUrl || "/placeholder.svg"}
                     alt={company.name}
                     className="w-full h-full object-cover"
                   />
                 ) : (
                   <div className="text-white font-bold text-lg">{company.name.charAt(0)}</div>
                 )}
               </div>
               <div className="space-y-1">
                 <div>
                   <span className="font-semibold text-gray-900">Company Name: </span>
                   <span className="text-gray-700">{company.name}</span>
                 </div>
                 <div>
                   <span className="font-semibold text-gray-900">Category: </span>
                   <span className="text-gray-700">
                     {company.clientType === "partner" ? "Partners" : "Brand"} - {company.partnerType || "Operator"}
                   </span>
                 </div>
                 <div>
                   <span className="font-semibold text-gray-900">Industry: </span>
                   <span className="text-gray-700">{company.industry || "Advertising"}</span>
                 </div>
                 {primaryContact && (
                   <>
                     <div>
                       <span className="font-semibold text-gray-900">Contact Person: </span>
                       <span className="text-gray-700">{primaryContact.name}</span>
                     </div>
                     <div>
                       <span className="font-semibold text-gray-900">Contact Details: </span>
                       <span className="text-gray-700">
                         {primaryContact.phone} / {primaryContact.email}
                       </span>
                     </div>
                   </>
                 )}
                 <div>
                   <span className="font-semibold text-gray-900">Address: </span>
                   <span className="text-gray-700">{company.address}</span>
                 </div>
               </div>
             </div>
             <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowComplianceDialog(true)}>Corporate Compliance Docs</Button>
           </div>
         </CardContent>
       </Card>
       {/* Compliance Documents Dialog */}
       <Dialog open={showComplianceDialog} onOpenChange={setShowComplianceDialog}>
         <DialogContent className="sm:max-w-[600px]">
           <DialogHeader>
             <DialogTitle className="text-xl font-bold text-gray-900">Corporate Compliance Requirements</DialogTitle>
             <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
               <X className="h-4 w-4" />
               <span className="sr-only">Close</span>
             </DialogClose>
           </DialogHeader>
           <div className="grid gap-1 p-4">
             {/* DTI/ BIR 2303 */}
             <div className="flex items-center justify-between space-x-2">
               <div className="flex items-center space-x-2">
                 {company.compliance?.dti ? (
                   <div className="h-5 w-5 bg-green-500 rounded-sm flex items-center justify-center">
                     <Check className="h-4 w-4 text-white" />
                   </div>
                 ) : (
                   <div className="h-5 w-5 border border-gray-300 rounded-sm" />
                 )}
                 <label htmlFor="dti-bir" className="text-sm font-medium leading-none">
                   DTI/ BIR 2303
                 </label>
               </div>
               {company.compliance?.dti ? (
                 <div className="flex items-center space-x-2">
                   <a href={company.compliance.dti} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                     DTI/BIR 2303.pdf
                   </a>
                   <Edit className="h-4 w-4 text-gray-500 cursor-pointer" onClick={() => triggerFileInput(dtiBirFileInputRef)} />
                 </div>
               ) : (
                 <Button variant="outline" size="sm" className="h-8" onClick={() => triggerFileInput(dtiBirFileInputRef)} disabled={uploadingDocument === "dti"}>
                   {uploadingDocument === "dti" ? "Uploading..." : <><Upload className="h-4 w-4 mr-2" /> Upload Document</>}
                 </Button>
               )}
             </div>
 
             {/* GIS */}
             <div className="flex items-center justify-between space-x-2">
               <div className="flex items-center space-x-2">
                 {company.compliance?.gis ? (
                   <div className="h-5 w-5 bg-green-500 rounded-sm flex items-center justify-center">
                     <Check className="h-4 w-4 text-white" />
                   </div>
                 ) : (
                   <div className="h-5 w-5 border border-gray-300 rounded-sm" />
                 )}
                 <label htmlFor="gis" className="text-sm font-medium leading-none">
                   GIS
                 </label>
               </div>
               {company.compliance?.gis ? (
                 <div className="flex items-center space-x-2">
                   <a href={company.compliance.gis} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                     GIS.pdf
                   </a>
                   <Edit className="h-4 w-4 text-gray-500 cursor-pointer" onClick={() => triggerFileInput(gisFileInputRef)} />
                 </div>
               ) : (
                 <Button variant="outline" size="sm" className="h-8" onClick={() => triggerFileInput(gisFileInputRef)} disabled={uploadingDocument === "gis"}>
                   {uploadingDocument === "gis" ? "Uploading..." : <><Upload className="h-4 w-4 mr-2" /> Upload Document</>}
                 </Button>
               )}
             </div>
 
             {/* ID with signature */}
             <div className="flex items-center justify-between space-x-2">
               <div className="flex items-center space-x-2">
                 {company.compliance?.id ? (
                   <div className="h-5 w-5 bg-green-500 rounded-sm flex items-center justify-center">
                     <Check className="h-4 w-4 text-white" />
                   </div>
                 ) : (
                   <div className="h-5 w-5 border border-gray-300 rounded-sm" />
                 )}
                 <label htmlFor="id-signature" className="text-sm font-medium leading-none">
                   ID with signature
                 </label>
               </div>
               {company.compliance?.id ? (
                 <div className="flex items-center space-x-2">
                   <a href={company.compliance.id} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                     ID_with_signature.pdf
                   </a>
                   <Edit className="h-4 w-4 text-gray-500 cursor-pointer" onClick={() => triggerFileInput(idSignatureFileInputRef)} />
                 </div>
               ) : (
                 <Button variant="outline" size="sm" className="h-8" onClick={() => triggerFileInput(idSignatureFileInputRef)} disabled={uploadingDocument === "id"}>
                   {uploadingDocument === "id" ? "Uploading..." : <><Upload className="h-4 w-4 mr-2" /> Upload Document</>}
                 </Button>
               )}
             </div>
           </div>
 
           {/* Hidden file inputs */}
           <input
             type="file"
             ref={dtiBirFileInputRef}
             onChange={(e) => handleFileUpload(e, "dti")}
             className="hidden"
             accept="application/pdf,image/*"
           />
           <input
             type="file"
             ref={gisFileInputRef}
             onChange={(e) => handleFileUpload(e, "gis")}
             className="hidden"
             accept="application/pdf,image/*"
           />
           <input
             type="file"
             ref={idSignatureFileInputRef}
             onChange={(e) => handleFileUpload(e, "id")}
             className="hidden"
             accept="application/pdf,image/*"
           />
         </DialogContent>
       </Dialog>
 
       {/* Tabs */}
       <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
         <TabsList className="grid w-full grid-cols-4">
           <TabsTrigger value="proposals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
             Proposals
           </TabsTrigger>
           <TabsTrigger value="cost-estimates">Cost Estimates</TabsTrigger>
           <TabsTrigger value="quotations">Quotations</TabsTrigger>
           <TabsTrigger value="bookings">Bookings</TabsTrigger>
         </TabsList>
 
         <TabsContent value="proposals" className="space-y-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                     placeholder="Search proposals..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10 w-64"
                   />
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-500">Total: {proposals.length}</span>
                   <span className="text-sm text-gray-500">All Time</span>
                 </div>
               </div>
 
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Project ID</TableHead>
                     <TableHead>Proposal ID</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Sites</TableHead>
                     <TableHead>Sent To</TableHead>
                     <TableHead>Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredProposals.map((proposal) => (
                     <TableRow key={proposal.id}>
                       <TableCell className="text-blue-600 font-medium">{proposal.id}</TableCell>
                       <TableCell>{proposal.proposalNumber}</TableCell>
                       <TableCell>{proposal.date}</TableCell>
                       <TableCell>({proposal.sites}) Sites</TableCell>
                       <TableCell>{proposal.sentTo}</TableCell>
                       <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
 
               <div className="flex items-center justify-between mt-6">
                 <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                   <Printer className="h-4 w-4" />
                   <span>Print</span>
                 </Button>
                 <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
                   <Plus className="h-4 w-4" />
                   <span>Create New Proposal</span>
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="cost-estimates" className="space-y-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                     placeholder="Search cost estimates..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10 w-64"
                   />
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-500">Total: {costEstimates.length}</span>
                   <span className="text-sm text-gray-500">All Time</span>
                 </div>
               </div>
 
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Cost Estimate ID</TableHead>
                     <TableHead>Title</TableHead>
                     <TableHead>Start Date</TableHead>
                     <TableHead>End Date</TableHead>
                     <TableHead>Total Amount</TableHead>
                     <TableHead>Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {costEstimates.filter(
                     (ce) =>
                       ce.costEstimateNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ce.title?.toLowerCase().includes(searchTerm.toLowerCase())
                   ).map((costEstimate) => (
                     <TableRow key={costEstimate.id}>
                       <TableCell className="text-blue-600 font-medium">{costEstimate.costEstimateNumber}</TableCell>
                       <TableCell>{costEstimate.title}</TableCell>
                       <TableCell>{costEstimate.startDate}</TableCell>
                       <TableCell>{costEstimate.endDate}</TableCell>
                       <TableCell>{costEstimate.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })}</TableCell>
                       <TableCell>{getStatusBadge(costEstimate.status)}</TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
 
               <div className="flex items-center justify-between mt-6">
                 <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                   <Printer className="h-4 w-4" />
                   <span>Print</span>
                 </Button>
                 <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
                   <Plus className="h-4 w-4" />
                   <span>Create New Cost Estimate</span>
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
         {/* Quotations Tab */}
         <TabsContent value="quotations" className="space-y-4">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                     placeholder="Search quotations..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10 w-64"
                   />
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-500">Total: {quotations.length}</span>
                   <span className="text-sm text-gray-500">All Time</span>
                 </div>
               </div>
 
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Project ID</TableHead>
                     <TableHead>Quotation ID</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Site</TableHead>
                     <TableHead>Duration</TableHead>
                     <TableHead>Amount</TableHead>
                     <TableHead>Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {quotations.filter(
                     (quotation) =>
                       quotation.quotation_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       quotation.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
                   ).map((quotation) => (
                     <TableRow key={quotation.id}>
                       <TableCell className="text-blue-600 font-medium">{quotation.id}</TableCell>
                       <TableCell>{quotation.quotation_number}</TableCell>
                       <TableCell>
                         {new Date(quotation.created).toLocaleDateString("en-US", {
                           month: "short",
                           day: "numeric",
                           year: "numeric",
                         })}
                       </TableCell>
                       <TableCell>{quotation.items?.[0]?.location || "N/A"}</TableCell>
                       <TableCell>
                         {new Date(quotation.start_date).toLocaleDateString("en-US", {
                           month: "short",
                           day: "numeric",
                           year: "numeric",
                         })} to{" "}
                         {new Date(quotation.end_date).toLocaleDateString("en-US", {
                           month: "short",
                           day: "numeric",
                           year: "numeric",
                         })}
                         <br />
                         ({Math.floor(quotation.duration_days / 30)}{" "}
                         months and {quotation.duration_days % 30} days)
                       </TableCell>
                       <TableCell>{quotation.total_amount.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })}</TableCell>
                       <TableCell>
                         <Badge
                           className={`${
                             quotation.status === "Expired"
                               ? "bg-gray-200 text-gray-800"
                               : "bg-green-100 text-green-800"
                           } rounded-md px-2 py-1 text-xs font-medium`}
                         >
                           {quotation.status}
                         </Badge>
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
 
               <div className="flex items-center justify-between mt-6">
                 <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                   <Printer className="h-4 w-4" />
                   <span>Print</span>
                 </Button>
                 <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
                   <Plus className="h-4 w-4" />
                   <span>Create New Quotation</span>
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="bookings">
           <Card>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                   <Input
                     placeholder="Search bookings..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-10 w-64"
                   />
                 </div>
                 <div className="flex items-center space-x-2">
                   <span className="text-sm text-gray-500">Total: {bookings.length}</span>
                   <span className="text-sm text-gray-500">All Time</span>
                 </div>
               </div>
 
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Project ID</TableHead>
                     <TableHead>JO #</TableHead>
                     <TableHead>Date</TableHead>
                     <TableHead>Site</TableHead>
                     <TableHead>Duration</TableHead>
                     <TableHead>Amount</TableHead>
                     <TableHead>Status</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredBookings.map((booking) => {
                     const startDate = new Date(booking.start_date);
                     const endDate = new Date(booking.end_date);
                     const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                     const diffMonths = Math.floor(diffDays / 30);
                     const remainingDays = diffDays % 30;

                     return (
                       <TableRow key={booking.id}>
                         <TableCell className="text-blue-600 font-medium">{booking.id}</TableCell>
                         <TableCell>{booking.product_id}</TableCell>
                         <TableCell>
                           {booking.start_date}
                         </TableCell>
                         <TableCell>{"Petplans"}</TableCell> {/* Placeholder for Site */}
                         <TableCell>
                           {startDate.toLocaleDateString("en-US", {
                             month: "short",
                             day: "numeric",
                             year: "numeric",
                           })} to{" "}
                           {endDate.toLocaleDateString("en-US", {
                             month: "short",
                             day: "numeric",
                             year: "numeric",
                           })}
                           <br />
                           ({diffMonths} months and {remainingDays} days)
                         </TableCell>
                         <TableCell>{booking.total_cost.toLocaleString('en-US', { style: 'currency', currency: 'PHP' })}</TableCell>
                         <TableCell>{getStatusBadge(booking.status)}</TableCell>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
 
               <div className="flex items-center justify-between mt-6">
                 <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                   <Printer className="h-4 w-4" />
                   <span>Print</span>
                 </Button>
                 <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2">
                   <Plus className="h-4 w-4" />
                   <span>Create New Booking</span>
                 </Button>
               </div>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   )}
