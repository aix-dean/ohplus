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

export default function ClientDatabasePage() {
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

  // Load clients on initial render and when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadClients(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, statusFilter])

  // Function to load clients
  const loadClients = async (reset = false) => {
    setLoading(true)
    try {
      console.log("Loading clients with filters:", { debouncedSearchTerm, statusFilter })

      // If reset is true, start from the beginning
      const currentLastDoc = reset ? null : lastDoc

      // Get clients
      const result = await getPaginatedClients(itemsPerPage, currentLastDoc, debouncedSearchTerm, statusFilter)
      console.log("Loaded clients:", result.items.length)

      // Update state
      if (reset) {
        setClients(result.items)
      } else {
        setClients((prev) => [...prev, ...result.items])
      }

      setLastDoc(result.lastDoc)
      setHasMore(result.hasMore)

      // Get total count
      const count = await getClientsCount(debouncedSearchTerm, statusFilter)
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
        return <Badge className="bg-green-500">Active</Badge>
      case "inactive":
        return <Badge className="bg-gray-500">Inactive</Badge>
      case "lead":
        return <Badge className="bg-blue-500">Lead</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <Toaster />
      <header className="flex justify-between items-center p-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold">Sales Client Database</h1>
          <p className="text-sm text-gray-500">
            Manage your client database ({totalClients} {totalClients === 1 ? "client" : "clients"})
          </p>
        </div>
        <ClientDialog onSuccess={() => loadClients(true)} />
      </header>

      <main className="p-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-[180px]">
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
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && clients.length === 0 ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`loading-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-[150px]" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-[120px]" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-[180px]" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-[120px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[80px]" />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-5 w-[100px]" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-8 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No clients found. {debouncedSearchTerm && "Try a different search term."}
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.company}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatTimestamp(client.updated)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <div className="md:flex space-x-2 hidden">
                          <Button variant="ghost" size="icon" onClick={() => handleViewClient(client)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClient(client)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="md:hidden">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewClient(client)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClient(client)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              {loading ? "Loading..." : "Load More"}
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
          />
        )}
      </main>
    </div>
  )
}
