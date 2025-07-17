"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Users, Globe, Monitor } from "lucide-react"

interface AnalyticsData {
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalViews: 0,
    guestViews: 0,
    uniquePages: 0,
    webPlatform: 0,
  })

  useEffect(() => {
    const q = query(collection(db, "analytics_ohplus"), orderBy("created", "desc"), limit(100))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data: AnalyticsData[] = []
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        } as AnalyticsData)
      })

      setAnalyticsData(data)

      // Calculate stats
      const uniquePages = new Set(data.map((item) => item.page)).size
      const guestViews = data.filter((item) => item.isGuest).length
      const webPlatform = data.filter((item) => item.platform === "WEB").length

      setStats({
        totalViews: data.length,
        guestViews,
        uniquePages,
        webPlatform,
      })

      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleString()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Real-time monitoring of analytics_ohplus collection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Real-time monitoring of analytics_ohplus collection</p>
        </div>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <div className="w-2 h-2 bg-green-600 rounded-full mr-2 animate-pulse" />
          Live
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.guestViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Pages</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniquePages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Platform</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.webPlatform}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest {analyticsData.length} analytics entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>UID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{formatDate(item.created)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.page}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isGuest ? "destructive" : "default"}>
                        {item.isGuest ? "Guest" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.ip_address}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.geopoint
                        ? `${item.geopoint.latitude.toFixed(4)}, ${item.geopoint.longitude.toFixed(4)}`
                        : "N/A"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.uid || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Data View */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data Structure</CardTitle>
          <CardDescription>Latest document structure for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.length > 0 && (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(analyticsData[0], null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
