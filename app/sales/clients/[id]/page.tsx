"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Edit, Search, Printer, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Toaster } from "sonner"

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
}

interface Proposal {
  id: string
  proposalId: string
  projectId: string
  date: string
  sites: number
  sentTo: string
  status: string
}

export default function ClientInformationPage() {
  const router = useRouter()
  const params = useParams()
  const { userData } = useAuth()
  const clientId = params.id as string

  const [company, setCompany] = useState<Company | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("proposals")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (clientId && userData?.company_id) {
      loadClientData()
      loadProposals()
    }
  }, [clientId, userData?.company_id])

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
      // Mock data for proposals - replace with actual Firebase query
      const mockProposals: Proposal[] = [
        {
          id: "1",
          proposalId: "PP000723",
          projectId: "PID00412",
          date: "March 25, 2025",
          sites: 5,
          sentTo: "Email, Messenger",
          status: "Open Inquiry",
        },
        {
          id: "2",
          proposalId: "PP000474",
          projectId: "PID00892",
          date: "March 1, 2025",
          sites: 2,
          sentTo: "Email, Messenger",
          status: "For Cost Estimate",
        },
        {
          id: "3",
          proposalId: "PP000260",
          projectId: "PID00925",
          date: "February 10, 2025",
          sites: 7,
          sentTo: "Email, Messenger",
          status: "Open Inquiry",
        },
      ]
      setProposals(mockProposals)
    } catch (error) {
      console.error("Error loading proposals:", error)
      toast.error("Failed to load proposals")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      "Open Inquiry": "bg-gray-100 text-gray-800",
      "For Cost Estimate": "bg-green-100 text-green-800",
      Approved: "bg-blue-100 text-blue-800",
      Rejected: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
        {status}
      </Badge>
    )
  }

  const filteredProposals = proposals.filter(
    (proposal) =>
      proposal.proposalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposal.projectId.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Corporate Compliance Docs</Button>
          </div>
        </CardContent>
      </Card>

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
                      <TableCell className="text-blue-600 font-medium">{proposal.projectId}</TableCell>
                      <TableCell>{proposal.proposalId}</TableCell>
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

        <TabsContent value="cost-estimates">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center py-8">Cost estimates will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center py-8">Quotations will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center py-8">Bookings will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
