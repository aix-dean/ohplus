"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Users, Globe, Eye, MapPin, Clock, User, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface AnalyticsDocument {
  id: string
  action: string
  created: any
  geopoint: [number, number] | { latitude: number; longitude: number }
  ip_address: string
  isGuest: boolean
  page: string
  platform: string
  tags: Array<{
    action: string
    isGuest: boolean
    page: string
    platform: string
    section: string
    uid?: string
  }>
  uid: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log("Setting up analytics listener...")

    try {
      // Set up real-time listener for analytics_ohplus collection
      const analyticsQuery = query(collection(db, "analytics_ohplus"), orderBy("created", "desc"), limit(100))

      const unsubscribe = onSnapshot(
        analyticsQuery,
        (snapshot) => {
          console.log("Received analytics data:", snapshot.size, "documents")

          const data = snapshot.docs.map((doc) => {
            const docData = doc.data()
            return {
              id: doc.id,
              ...docData,
            } as AnalyticsDocument
          })

          setAnalyticsData(data)
          setIsLoading(false)
          setIsConnected(true)
          setError(null)
        },
        (error) => {
          console.error("Error fetching analytics data:", error)
          setError(error.message)
          setIsLoading(false)
          setIsConnected(false)
        },
      )

      return () => {
        console.log("Cleaning up analytics listener")
        unsubscribe()
      }
    } catch (err) {
      console.error("Error setting up listener:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      setIsLoading(false)
    }
  }, [])

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return "Invalid Date"
    }
  }

  const formatGeopoint = (geopoint: any) => {
    if (!geopoint) return "N/A"

    if (Array.isArray(geopoint)) {
      return `${geopoint[0]?.toFixed(6) || 0}, ${geopoint[1]?.toFixed(6) || 0}`
    }

    if (typeof geopoint === "object" && geopoint.latitude !== undefined) {
      return `${geopoint.latitude.toFixed(6)}, ${geopoint.longitude.toFixed(6)}`
    }

    return "Invalid Location"
  }

  // Calculate summary statistics
  const totalViews = analyticsData.length
  const guestViews = analyticsData.filter((item) => item.isGuest).length
  const webPlatform = analyticsData.filter((item) => item.platform === "WEB").length
  const uniquePages = new Set(analyticsData.map((item) => item.page)).size

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <Button variant="outline" onClick={() => router.push("/login")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-600">Connection Error</h3>
            <p className="text-muted-foreground text-center mb-4">Failed to connect to analytics database: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry Connection</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of analytics_ohplus collection
            <span className="ml-2 inline-flex items-center">
              <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
              {isConnected ? "Live" : "Disconnected"}
            </span>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/login")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">All page views tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestViews}</div>
            <p className="text-xs text-muted-foreground">Views by guest users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Platform</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webPlatform}</div>
            <p className="text-xs text-muted-foreground">Views from web platform</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Pages</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniquePages}</div>
            <p className="text-xs text-muted-foreground">Different pages visited</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Analytics Events
          </CardTitle>
          <CardDescription>Latest {analyticsData.length} events from analytics_ohplus collection</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>UID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Eye className="h-3 w-3" />
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.page}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Globe className="h-3 w-3" />
                        {item.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={item.isGuest ? "destructive" : "default"}
                        className="flex items-center gap-1 w-fit"
                      >
                        <User className="h-3 w-3" />
                        {item.isGuest ? "Guest" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground font-mono">
                        <MapPin className="h-3 w-3" />
                        {formatGeopoint(item.geopoint)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.ip_address}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(item.created)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{item.uid || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Structure */}
      {analyticsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Document Structure</CardTitle>
            <CardDescription>Raw JSON structure of the most recent analytics document</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(
                  {
                    ...analyticsData[0],
                    created: analyticsData[0].created?.toDate?.()?.toISOString() || analyticsData[0].created,
                  },
                  null,
                  2,
                )}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {analyticsData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data</h3>
            <p className="text-muted-foreground text-center mb-4">
              No analytics events have been recorded yet in the analytics_ohplus collection.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Visit the login page to generate some analytics data, then return here to view it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
