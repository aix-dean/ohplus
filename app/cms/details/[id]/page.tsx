import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import LoopTimeline from "@/components/loop-timeline"
import { Clock, Info, Settings, Activity } from "lucide-react"

interface Props {
  params: {
    id: string
  }
}

// Mock data - replace with actual data fetching
const mockProduct = {
  id: "1",
  name: "LED Billboard - EDSA Guadalupe",
  description: "Premium LED billboard located at EDSA Guadalupe with high visibility and traffic",
  location: "EDSA Guadalupe, Makati City",
  dimensions: "6m x 3m",
  resolution: "1920x1080",
  brightness: "5000 nits",
  status: "active",
  contentType: "dynamic",
  lastUpdated: "2024-01-15T10:30:00Z",
  cms: {
    spots_per_loop: 6,
    loops_per_day: 24,
    spot_duration: 10,
    start_time: "06:00",
    total_daily_spots: 144,
    loop_duration: 60,
  },
  specifications: {
    pixelPitch: "P4",
    refreshRate: "60Hz",
    viewingAngle: "160°",
    operatingTemp: "-20°C to +60°C",
    powerConsumption: "800W/m²",
    lifespan: "100,000 hours",
  },
  connectivity: {
    connection: "4G/WiFi",
    remoteControl: "Yes",
    scheduling: "Advanced",
    monitoring: "24/7",
  },
}

export default async function Page({ params }: Props) {
  const { id } = params

  if (!id) {
    notFound()
  }

  // In a real app, fetch the product data here
  const product = mockProduct

  if (!product) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600 mt-1">{product.description}</p>
        </div>
        <Badge className={getStatusColor(product.status)}>
          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Info size={16} />
            Overview
          </TabsTrigger>
          <TabsTrigger value="specifications" className="flex items-center gap-2">
            <Settings size={16} />
            Specifications
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock size={16} />
            Loop Timeline
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity size={16} />
            Activity
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>General details about this display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">ID</span>
                    <p className="text-sm font-mono">{product.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <p className="text-sm">{product.status}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Location</span>
                    <p className="text-sm">{product.location}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Dimensions</span>
                    <p className="text-sm">{product.dimensions}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Resolution</span>
                    <p className="text-sm">{product.resolution}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Content Type</span>
                    <p className="text-sm">{product.contentType}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CMS Configuration</CardTitle>
                <CardDescription>Current loop and scheduling settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Spots per Loop</span>
                    <p className="text-lg font-semibold">{product.cms.spots_per_loop}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Loops per Day</span>
                    <p className="text-lg font-semibold">{product.cms.loops_per_day}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Spot Duration</span>
                    <p className="text-lg font-semibold">{product.cms.spot_duration}s</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Start Time</span>
                    <p className="text-lg font-semibold">{product.cms.start_time}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Total Daily Spots</span>
                    <p className="text-lg font-semibold">{product.cms.total_daily_spots}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Loop Duration</span>
                    <p className="text-lg font-semibold">{product.cms.loop_duration}s</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common actions for this display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button variant="default">Edit Content</Button>
                <Button variant="outline">Schedule Maintenance</Button>
                <Button variant="outline">View Analytics</Button>
                <Button variant="outline">Export Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Specifications Tab */}
        <TabsContent value="specifications" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Display Specifications</CardTitle>
                <CardDescription>Technical specifications of the LED display</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Pixel Pitch</span>
                    <p className="text-sm">{product.specifications.pixelPitch}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Refresh Rate</span>
                    <p className="text-sm">{product.specifications.refreshRate}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Viewing Angle</span>
                    <p className="text-sm">{product.specifications.viewingAngle}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Operating Temperature</span>
                    <p className="text-sm">{product.specifications.operatingTemp}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Power Consumption</span>
                    <p className="text-sm">{product.specifications.powerConsumption}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Lifespan</span>
                    <p className="text-sm">{product.specifications.lifespan}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connectivity & Control</CardTitle>
                <CardDescription>Network and control capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Connection</span>
                    <p className="text-sm">{product.connectivity.connection}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Remote Control</span>
                    <p className="text-sm">{product.connectivity.remoteControl}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Scheduling</span>
                    <p className="text-sm">{product.connectivity.scheduling}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Monitoring</span>
                    <p className="text-sm">{product.connectivity.monitoring}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <LoopTimeline cmsData={product.cms} />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and changes to this display</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Content updated successfully</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Loop schedule modified</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Maintenance scheduled</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Display status changed to active</p>
                    <p className="text-xs text-gray-500">1 week ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
