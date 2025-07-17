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
import { Activity, Users, Globe, Eye, MapPin, Clock, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface AnalyticsDocument {
  id: string
  action: string
  created: any
  geopoint: {
    latitude: number
    longitude: number
  }
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
  }>
  uid: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Set up real-time listener for analytics_ohplus collection
    const analyticsQuery = query(collection(db, "analytics_ohplus"), orderBy("created", "desc"), limit(50))

    const unsubscribe = onSnapshot(
      analyticsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AnalyticsDocument[]

        setAnalyticsData(data)
        setIsLoading(false)
        setIsConnected(true)
      },
      (error) => {
        console.error("Error fetching analytics data:", error)
        setIsLoading(false)
        setIsConnected(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString()
  }

  const formatGeopoint = (geopoint: any) => {
    if (!geopoint) return "N/A"
    return `${geopoint.latitude.toFixed(6)}, ${geopoint.longitude.toFixed(6)}`
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
          <CardDescription>Latest events from analytics_ohplus collection</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.page}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {item.platform}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isGuest ? "destructive" : "default"} className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {item.isGuest ? "Guest" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
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
            <p className="text-muted-foreground text-center">
              No analytics events have been recorded yet. Visit the login page to generate some data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
