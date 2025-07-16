"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { Search, MoreHorizontal, X, ClipboardList } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/contexts/auth-context"
import { getJobOrdersByCompanyId } from "@/lib/job-order-service"
import { getUserById } from "@/lib/firebase-service"
import type { JobOrder } from "@/lib/types/job-order"
import { useRouter } from "next/navigation"

export default function LogisticsJobOrdersPage() {
  const { user, userData } = useAuth()
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userNames, setUserNames] = useState<Record<string, string>>({})
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const router = useRouter()

  const fetchUserName = async (userId: string): Promise<string> => {
    if (userNames[userId]) {
      return userNames[userId]
    }

    try {
      const user = await getUserById(userId)
      const name = user?.name || user?.first_name || "Unknown User"
      setUserNames((prev) => ({ ...prev, [userId]: name }))
      return name
    } catch (error) {
      console.error("Error fetching user name:", error)
      return "Unknown User"
    }
  }

  useEffect(() => {
    const fetchJOs = async () => {
      console.log("=== DEBUG: Starting job orders fetch ===")
      console.log("User:", user?.uid)
      console.log("UserData:", userData)
      console.log("Company ID:", userData?.company_id)

      if (!user?.uid) {
        console.log("DEBUG: No user UID found")
        setError("User not authenticated.")
        setLoading(false)
        return
      }

      if (!userData?.company_id) {
        console.log("DEBUG: No company ID found in userData")
        setError("Company not found. Please ensure your account is properly set up.")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        console.log("DEBUG: Fetching job orders for company:", userData.company_id)
        const fetchedJOs = await getJobOrdersByCompanyId(userData.company_id)

        console.log("DEBUG: Fetched job orders:", fetchedJOs)
        console.log("DEBUG: Number of job orders:", fetchedJOs.length)

        setJobOrders(fetchedJOs)
        setDebugInfo({
          userId: user.uid,
          companyId: userData.company_id,
          jobOrdersCount: fetchedJOs.length,
          userData: userData,
        })

        // Fetch user names for all unique assignees
        const uniqueAssignees = [...new Set(fetchedJOs.map((jo) => jo.assignTo).filter(Boolean))]
        console.log("DEBUG: Unique assignees:", uniqueAssignees)

        for (const assigneeId of uniqueAssignees) {
          await fetchUserName(assigneeId)
        }
      } catch (err) {
        console.error("Failed to fetch job orders:", err)
        setError(`Failed to load job orders: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have both user and userData
    if (user && userData) {
      fetchJOs()
    } else {
      console.log("DEBUG: Waiting for user and userData to be available")
      console.log("User available:", !!user)
      console.log("UserData available:", !!userData)
    }
  }, [user, userData]) // Updated dependency array

  const filteredJobOrders = useMemo(() => {
    if (!searchTerm) {
      return jobOrders
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase()
    return jobOrders.filter(
      (jo) =>
        jo.joNumber?.toLowerCase().includes(lowerCaseSearchTerm) ||
        jo.siteName?.toLowerCase().includes(lowerCaseSearchTerm) ||
        jo.joType?.toLowerCase().includes(lowerCaseSearchTerm) ||
        jo.requestedBy?.toLowerCase().includes(lowerCaseSearchTerm) ||
        (jo.assignTo && jo.assignTo.toLowerCase().includes(lowerCaseSearchTerm)),
    )
  }, [jobOrders, searchTerm])

  // Helper function to get status color (using joType for now, as no 'status' field exists)
  const getJoTypeColor = (joType: string) => {
    switch (joType?.toLowerCase()) {
      case "installation":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "repair":
        return "bg-red-100 text-red-800 border-red-200"
      case "dismantling":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-purple-100 text-purple-800 border-purple-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Job Orders</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search job orders..."
              className="pl-10 pr-8 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-full max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3">JO #</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Site</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Date Requested</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">JO Type</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Deadline</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Requested By</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Assigned To</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 w-[50px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <TableRow key={i} className="border-b border-gray-100">
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-28" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell className="py-3">
                        <Skeleton className="h-4 w-8 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-red-500">
            <p className="text-lg font-semibold mb-4">{error}</p>
            {debugInfo && (
              <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700 max-w-md">
                <h3 className="font-semibold mb-2">Debug Information:</h3>
                <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            )}
            <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Job Orders</h1>
          <Button
            onClick={() => router.push("/logistics/job-orders/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Create JO
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search job orders..."
            className="pl-10 pr-8 py-2 rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-500 hover:bg-gray-100"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>

        {/* Debug info for development */}
        {process.env.NODE_ENV === "development" && debugInfo && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <details>
              <summary className="cursor-pointer font-semibold">Debug Information</summary>
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
            </details>
          </div>
        )}

        {filteredJobOrders.length === 0 ? (
          <Card className="border-gray-200 shadow-sm rounded-xl">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No job orders found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? "No job orders match your search criteria." : "No job orders have been created yet."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push("/logistics/job-orders/create")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Create Your First Job Order
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-sm overflow-hidden rounded-xl">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b border-gray-200">
                  <TableHead className="font-semibold text-gray-900 py-3">JO #</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Site</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Date Requested</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">JO Type</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Deadline</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Requested By</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3">Assigned To</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-3 w-[50px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJobOrders.map((jo) => (
                  <TableRow
                    key={jo.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                    onClick={() => router.push(`/logistics/job-orders/${jo.id}`)}
                  >
                    <TableCell className="font-medium py-3">{jo.joNumber}</TableCell>
                    <TableCell className="py-3">{jo.siteName}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="border font-medium bg-gray-100 text-gray-800 border-gray-200">
                        {jo.dateRequested ? format(new Date(jo.dateRequested), "MMM d, yyyy") : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`${getJoTypeColor(jo.joType)} border font-medium`}>
                        {jo.joType}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="outline" className="border font-medium bg-gray-100 text-gray-800 border-gray-200">
                        {jo.deadline ? format(new Date(jo.deadline), "MMM d, yyyy") : "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">{jo.requestedBy}</TableCell>
                    <TableCell className="py-3">{userNames[jo.assignTo] || jo.assignTo || "Unassigned"}</TableCell>
                    <TableCell className="text-right py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/logistics/job-orders/${jo.id}`)
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              alert(`Edit JO ${jo.joNumber}`)
                            }}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              alert(`Assign JO ${jo.joNumber}`)
                            }}
                          >
                            Assign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
