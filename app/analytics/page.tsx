"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, Globe, MapPin, Monitor, User, Clock } from "lucide-react"

interface AnalyticsDocument {
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
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [totalViews, setTotalViews] = useState(0)
  const [guestViews, setGuestViews] = useState(0)
  const [webViews, setWebViews] = useState(0)

  useEffect(() => {
    const q = query(collection(db, "analytics_ohplus"), orderBy("created", "desc"), limit(100))

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs: AnalyticsDocument[] = []
      querySnapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data(),
        } as AnalyticsDocument)
      })

      setAnalyticsData(docs)
      setTotalViews(docs.length)
      setGuestViews(docs.filter((doc) => doc.isGuest).length)
      setWebViews(docs.filter((doc) => doc.platform === "WEB").length)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A"
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString()
    } catch (error) {
      return "Invalid Date"
    }
  }

  const formatGeopoint = (geopoint: [number, number]) => {
    if (!geopoint || !Array.isArray(geopoint)) return "N/A"
    return `${geopoint[0]?.toFixed(6)}, ${geopoint[1]?.toFixed(6)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Views</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guestViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Web Platform</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Monitoring</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">●</div>
            <p className="text-xs text-muted-foreground">Real-time</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Analytics Events</CardTitle>
          <CardDescription>Real-time monitoring of analytics_ohplus collection</CardDescription>
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
                  <TableHead>Guest</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>UID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyticsData.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(doc.created)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{doc.page}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{doc.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={doc.isGuest ? "destructive" : "default"}>{doc.isGuest ? "Guest" : "User"}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{doc.ip_address}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {formatGeopoint(doc.geopoint)}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{doc.uid || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Details */}
      {analyticsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Document Structure</CardTitle>
            <CardDescription>Raw document data from analytics_ohplus collection</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <pre className="text-xs bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(analyticsData[0], null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {analyticsData.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No analytics data found</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
