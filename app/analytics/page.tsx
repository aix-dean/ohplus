"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Activity, Globe, MapPin, Monitor, User, Clock } from "lucide-react"

interface AnalyticsData {
  id: string
  action: string
  created: any
  geopoint: [number, number]
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
    uid: string
  }>
  uid: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalViews: 0,
    guestViews: 0,
    uniquePages: 0,
    platforms: {} as Record<string, number>,
  })

  useEffect(() => {
    const q = query(collection(db, "analytics_ohplus"), orderBy("created", "desc"), limit(100))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: AnalyticsData[] = []
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        } as AnalyticsData)
      })

      setAnalyticsData(data)
      calculateStats(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const calculateStats = (data: AnalyticsData[]) => {
    const totalViews = data.length
    const guestViews = data.filter((item) => item.isGuest).length
    const uniquePages = new Set(data.map((item) => item.page)).size
    const platforms = data.reduce(
      (acc, item) => {
        acc[item.platform] = (acc[item.platform] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    setStats({
      totalViews,
      guestViews,
      uniquePages,
      platforms,
    })
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    } catch {
      return "Invalid Date"
    }
  }

  const formatGeopoint = (geopoint: [number, number]) => {
    if (!geopoint || !Array.isArray(geopoint)) return "N/A"
    return `${geopoint[0].toFixed(6)}, ${geopoint[1].toFixed(6)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
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
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.guestViews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalViews > 0 ? Math.round((stats.guestViews / stats.totalViews) * 100) : 0}% of total
            </p>
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
            <CardTitle className="text-sm font-medium">Platforms</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(stats.platforms).map(([platform, count]) => (
                <div key={platform} className="flex justify-between text-sm">
                  <span>{platform}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest {analyticsData.length} page views and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{formatTimestamp(item.created)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.action}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.page}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.isGuest ? "destructive" : "default"}>
                        {item.isGuest ? "Guest" : "User"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatGeopoint(item.geopoint)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.ip_address}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Detailed View */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analytics Data</CardTitle>
          <CardDescription>Raw data structure for debugging and analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {analyticsData.slice(0, 10).map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Document #{index + 1}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">ID: {item.id}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Action:</strong> {item.action}
                    </div>
                    <div>
                      <strong>Created:</strong> {formatTimestamp(item.created)}
                    </div>
                    <div>
                      <strong>Page:</strong> {item.page}
                    </div>
                    <div>
                      <strong>Platform:</strong> {item.platform}
                    </div>
                    <div>
                      <strong>Is Guest:</strong> {item.isGuest ? "Yes" : "No"}
                    </div>
                    <div>
                      <strong>IP Address:</strong> {item.ip_address}
                    </div>
                    <div className="col-span-2">
                      <strong>Geopoint:</strong> {formatGeopoint(item.geopoint)}
                    </div>
                    <div className="col-span-2">
                      <strong>UID:</strong> {item.uid || "Empty"}
                    </div>
                    {item.tags && item.tags.length > 0 && (
                      <div className="col-span-2">
                        <strong>Tags:</strong>
                        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(item.tags, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
