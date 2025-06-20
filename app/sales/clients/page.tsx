"use client"

import { useState, useEffect } from "react"
import { type Client, getPaginatedClients, getClientsCount, deleteClient } from "@/lib/client-service"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ClientDialog } from "@/components/client-dialog"
import { Trash2, Eye, Search, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDistanceToNow } from "date-fns"
import { Toaster } from "sonner"
import { toast } from "sonner"
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context" // Import useAuth

export default function ClientDatabasePage() {
  const { user } = useAuth() // Get current user from auth context

  // State for clients data
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [totalClients, setTotalClients] = useState(0)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [itemsPerPage] = useState(10)

  // State for dialogs
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Load clients on initial render and when filters change
  useEffect(() => {
    if (user?.uid) {
      // Only load clients if user ID is available
      loadClients(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, statusFilter, user?.uid]) // Add user.uid to dependencies

  // Function to load clients
  const loadClients = async (reset = false) => {
    setLoading(true)
    try {
      console.log("Loading clients with filters:", { debouncedSearchTerm, statusFilter, uploadedBy: user?.uid })

      // If reset is true, start from the beginning
      const currentLastDoc = reset ? null : lastDoc

      // Get clients, passing the current user's UID as the uploadedByFilter
      const result = await getPaginatedClients(
        itemsPerPage,
        currentLastDoc,
        debouncedSearchTerm,
        statusFilter,
        user?.uid, // Pass current user's UID here
      )
      console.log("Loaded clients:", result.items.length)

      // Update state
      if (reset) {
        setClients(result.items)
      } else {
        setClients((prev) => [...prev, ...result.items])
      }

      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)

      // Get total count, passing the current user's UID as the uploadedByFilter
      const count = await getClientsCount(debouncedSearchTerm, statusFilter, user?.uid) // Pass current user's UID here
      setTotalClients(count)
    } catch (error) {
      console.error("Error loading clients:", error)
      toast.error("Failed to load clients")
    } finally {
      setLoading(false)
    }
  }

  // Function to load more clients
  const loadMore = () => {
    if (hasMore && !loading) {
      loadClients(false)
    }
  }

  // Function to handle client selection for viewing/editing
  const handleViewClient = (client: Client) => {
    setSelectedClient(client)
    setIsEditDialogOpen(true)
  }

  // Function to handle client deletion
  const handleDeleteClient = async (client: Client) => {
    if (confirm(`Are you sure you want to delete ${client.name}?`)) {
      try {
        await deleteClient(client.id)
        toast.success("Client deleted successfully")
        loadClients(true)
      } catch (error) {
        console.error("Error deleting client:", error)
        toast.error("Failed to delete client")
      }
    }
  }

  // Function to format the timestamp
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A"

    if (timestamp.toDate) {
      return formatDistanceToNow(timestamp.toDate(), { addSuffix: true })
    }

    return "N/A"
  }

  // Function to get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-500/80 text-white">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500 hover:bg-gray-500/80 text-white">Inactive</Badge>
      case "lead":
        return <Badge className="bg-blue-500 hover:bg-blue-500/80 text-white">Lead</Badge>
      default:
        return <Badge className="bg-gray-200 text-gray-800">{status}</Badge>
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
      <Toaster />
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b border-gray-200">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">Client Database</h1>
          <p className="text-md text-gray-600 mt-1">
            Manage your client accounts and relationships. ({totalClients} {totalClients === 1 ? "client" : "clients"})
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <ClientDialog onSuccess={() => loadClients(true)} />
        </div>
      </header>

      <main>
        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8 p-4 bg-white rounded-lg shadow-sm">
          <div className="relative flex-1 w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search clients by name, email, or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out text-base"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full md:w-[200px] h-11 border border-gray-300 rounded-md text-base">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Name</TableHead>
                <TableHead className="hidden md:table-cell py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Company
                </TableHead>
                <TableHead className="hidden lg:table-cell py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Email
                </TableHead>
                <TableHead className="hidden sm:table-cell py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Phone
                </TableHead>
                <TableHead className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</TableHead>
                <TableHead className="hidden md:table-cell py-3 px-4 text-left text-sm font-semibold text-gray-700">
                  Last Updated
                </TableHead>
                <TableHead className="py-3 px-4 text-right text-sm font-semibold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && clients.length === 0 ? (
                // Loading skeletons
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <TableRow key={`loading-${i}`} className="border-b border-gray-100 last:border-b-0">
                    <TableCell className="py-3 px-4">
                      <Skeleton className="h-5 w-[150px] bg-gray-200" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3 px-4">
                      <Skeleton className="h-5 w-[120px] bg-gray-200" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell py-3 px-4">
                      <Skeleton className="h-5 w-[180px] bg-gray-200" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell py-3 px-4">
                      <Skeleton className="h-5 w-[120px] bg-gray-200" />
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Skeleton className="h-5 w-[80px] bg-gray-200" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-3 px-4">
                      <Skeleton className="h-5 w-[100px] bg-gray-200" />
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <Skeleton className="h-8 w-8 ml-auto rounded-md bg-gray-200" />
                    </TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500 text-lg">
                    No clients found. {debouncedSearchTerm && "Try a different search term or status."}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-800 py-3 px-4">{client.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600 py-3 px-4">{client.company}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600 py-3 px-4">{client.email}</TableCell>
                    <TableCell className="hidden sm:table-cell text-gray-600 py-3 px-4">{client.phone}</TableCell>
                    <TableCell className="py-3 px-4">{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-gray-600 text-sm py-3 px-4">
                      {formatTimestamp(client.updated)}
                    </TableCell>
                    <TableCell className="text-right py-3 px-4">
                      <div className="flex justify-end items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-blue-600 hover:bg-gray-100"
                          onClick={() => handleViewClient(client)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View client</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-500 hover:text-red-600 hover:bg-gray-100"
                          onClick={() => handleDeleteClient(client)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete client</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">More actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => handleViewClient(client)}
                              className="flex items-center cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClient(client)}
                              className="flex items-center text-red-600 focus:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors duration-200 ease-in-out font-semibold"
            >
              {loading ? "Loading more clients..." : "Load More Clients"}
            </Button>
          </div>
        )}

        {/* Edit Client Dialog */}
        {selectedClient && (
          <ClientDialog
            client={selectedClient}
            onSuccess={() => {
              setSelectedClient(null)
              loadClients(true)
            }}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
        )}
      </main>
    </div>
  )
}
