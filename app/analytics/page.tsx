"use client"

import { useState, useEffect } from "react"
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Monitor, Users, Activity, Filter, RefreshCw } from "lucide-react"
import { format } from "date-fns"

interface AnalyticsData {
  id: string
  action: string
  created: any
  geopoint: any
  ip_address: string
  isGuest: boolean
  page: string
  platform: string
  tags: any[]
  uid: string
}

interface AnalyticsStats {
  totalViews: number
  uniquePages: number
  guestUsers: number
  platforms: { [key: string]: number }
  topPages: { [key: string]: number }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData[]>([])
  const [filteredData, setFilteredData] = useState<AnalyticsData[]>([])
  const [stats, setStats] = useState<AnalyticsStats>({
    totalViews: 0,
    uniquePages: 0,
    guestUsers: 0,
    platforms: {},
    topPages: {},
  })
  const [loading, setLoading] = useState(true)
  const [filterPage, setFilterPage] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("all")
  const [filterAction, setFilterAction] = useState("all")
  const [limitCount, setLimitCount] = useState(50)

  // Real-time listener for analytics data
  useEffect(() => {
    const q = query(collection(db, "analytics_ohplus"), orderBy("created", "desc"), limit(limitCount))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: AnalyticsData[] = []
      snapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        } as AnalyticsData)
      })

      setAnalyticsData(data)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [limitCount])

  // Calculate statistics
  useEffect(() => {
    const calculateStats = () => {
      const totalViews = analyticsData.length
      const uniquePages = new Set(analyticsData.map((item) => item.page)).size
      const guestUsers = analyticsData.filter((item) => item.isGuest).length

      const platforms: { [key: string]: number } = {}
      const topPages: { [key: string]: number } = {}

      analyticsData.forEach((item) => {
        platforms[item.platform] = (platforms[item.platform] || 0) + 1
        topPages[item.page] = (topPages[item.page] || 0) + 1
      })

      setStats({
        totalViews,
        uniquePages,
        guestUsers,
        platforms,
        topPages,
      })
    }

    calculateStats()
  }, [analyticsData])

  // Apply filters
  useEffect(() => {
    let filtered = analyticsData

    if (filterPage) {
      filtered = filtered.filter((item) => item.page.toLowerCase().includes(filterPage.toLowerCase()))
    }

    if (filterPlatform !== "all") {
      filtered = filtered.filter((item) => item.platform === filterPlatform)
    }

    if (filterAction !== "all") {
      filtered = filtered.filter((item) => item.action === filterAction)
    }

    setFilteredData(filtered)
  }, [analyticsData, filterPage, filterPlatform, filterAction])

  const clearFilters = () => {
    setFilterPage("")
    setFilterPlatform("all")
    setFilterAction("all")
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return format(date, "MMM dd, yyyy HH:mm:ss")
  }

  const formatGeopoint = (geopoint: any) => {
    if (!geopoint || !geopoint.latitude || !geopoint.longitude) return "N/A"
    return `${geopoint.latitude.toFixed(4)}, ${geopoint.longitude.toFixed(4)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor analytics_ohplus collection in real-time</p>
        </div>
        <Badge variant="outline" className="text-green-600">
          <Activity className="h-4 w-4 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Statistics Cards */}
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
            <CardTitle className="text-sm font-medium">Unique Pages</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniquePages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Guest Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.guestUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Platform</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.platforms).length > 0
                ? Object.keys(stats.platforms).reduce((a, b) => (stats.platforms[a] > stats.platforms[b] ? a : b))
                : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList>
          <TabsTrigger value="data">Raw Data</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="page-filter">Page</Label>
                  <Input
                    id="page-filter"
                    placeholder="Filter by page..."
                    value={filterPage}
                    onChange={(e) => setFilterPage(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="platform-filter">Platform</Label>
                  <Select value={filterPlatform} onValueChange={setFilterPlatform}>
                    <SelectTrigger>
                      <SelectValue placeholder="All platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All platforms</SelectItem>
                      <SelectItem value="WEB">WEB</SelectItem>
                      <SelectItem value="MOBILE">MOBILE</SelectItem>
                      <SelectItem value="APP">APP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="action-filter">Action</Label>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All actions</SelectItem>
                      <SelectItem value="page_view">Page View</SelectItem>
                      <SelectItem value="click">Click</SelectItem>
                      <SelectItem value="form_submit">Form Submit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Data ({filteredData.length} records)</CardTitle>
              <CardDescription>Real-time data from analytics_ohplus collection</CardDescription>
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
                      <TableHead>User Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>UID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{formatTimestamp(item.created)}</TableCell>
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
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {formatGeopoint(item.geopoint)}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{item.ip_address}</TableCell>
                        <TableCell className="font-mono text-sm">{item.uid || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.topPages)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([page, count]) => (
                      <div key={page} className="flex justify-between items-center">
                        <span className="font-medium">{page}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Platform Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Usage by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.platforms)
                    .sort(([, a], [, b]) => b - a)
                    .map(([platform, count]) => (
                      <div key={platform} className="flex justify-between items-center">
                        <span className="font-medium">{platform}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
