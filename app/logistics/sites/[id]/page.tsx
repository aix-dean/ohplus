"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Calendar,
  User,
  Building,
  Palette,
  Wrench,
  Shield,
  Clock,
  Monitor,
  Car,
  Eye,
  DollarSign,
  ImageIcon,
  Play,
  ArrowLeft,
  Edit,
  Settings,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getProductById } from "@/lib/firebase-service"
import { toast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  content_type: "static" | "dynamic"
  site_owner: string // Now a string instead of object
  specs_rental: {
    location: string
    geopoint: [number, number] | null
    width: number
    height: number
    site_orientation: string
    land_owner: string
    structure_color: string
    structure_contractor: string
    structure_condition: string
    structure_last_maintenance: string
    loop_duration?: number
    spots_per_loop?: number
    spot_duration?: number
    operating_hours?: {
      start: string
      end: string
    }
    brightness_schedule?: Array<{
      time_range: string
      brightness: number
    }>
    audience: {
      age_groups: string[]
      interests: string[]
      demographics: string[]
    }
    traffic_data: {
      daily_impressions: number
      peak_hours: string[]
      vehicle_count: number
    }
    rental_rates: {
      daily: number
      weekly: number
      monthly: number
    }
  }
  media: Array<{
    url: string
    type: "image" | "video"
    name: string
  }>
  seller_id: string
  seller_name: string
  created: any
  status: string
}

export default function SiteDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeMediaIndex, setActiveMediaIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productData = await getProductById(params.id as string)
        if (productData) {
          setProduct(productData as Product)
        } else {
          toast({
            title: "Site Not Found",
            description: "The requested site could not be found.",
            variant: "destructive",
          })
          router.push("/logistics/dashboard")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        toast({
          title: "Error",
          description: "Failed to load site details.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchProduct()
    }
  }, [params.id, router])

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Site Not Found</h1>
          <p className="text-gray-600 mb-6">The requested site could not be found.</p>
          <Button onClick={() => router.push("/logistics/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (date: any) => {
    if (!date) return "Not specified"
    if (date.toDate) {
      return date.toDate().toLocaleDateString()
    }
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant={product.content_type === "dynamic" ? "default" : "secondary"}>
                {product.content_type.charAt(0).toUpperCase() + product.content_type.slice(1)}
              </Badge>
              <Badge variant={product.status === "active" ? "default" : "secondary"}>
                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {product.specs_rental.location}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit Site
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Media Gallery */}
          {product.media && product.media.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Media Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Main Media Display */}
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    {product.media[activeMediaIndex]?.type === "image" ? (
                      <img
                        src={product.media[activeMediaIndex].url || "/placeholder.svg"}
                        alt={product.media[activeMediaIndex].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={product.media[activeMediaIndex].url}
                        className="w-full h-full object-cover"
                        controls
                      />
                    )}
                  </div>

                  {/* Media Thumbnails */}
                  {product.media.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {product.media.map((media, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveMediaIndex(index)}
                          className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                            index === activeMediaIndex ? "border-blue-500" : "border-gray-200"
                          }`}
                        >
                          {media.type === "image" ? (
                            <img
                              src={media.url || "/placeholder.svg"}
                              alt={media.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <Play className="h-6 w-6 text-gray-600" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>

          {/* Detailed Information Tabs */}
          <Card>
            <CardContent className="p-0">
              <Tabs defaultValue="structure" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="structure">Structure</TabsTrigger>
                  <TabsTrigger value="audience">Audience</TabsTrigger>
                  <TabsTrigger value="traffic">Traffic</TabsTrigger>
                  {product.content_type === "dynamic" && <TabsTrigger value="dynamic">Dynamic</TabsTrigger>}
                </TabsList>

                <TabsContent value="structure" className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Structure Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Dimensions</p>
                        <p className="font-medium">
                          {product.specs_rental.width}' × {product.specs_rental.height}'
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Orientation</p>
                        <p className="font-medium">{product.specs_rental.site_orientation || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Land Owner</p>
                        <p className="font-medium">{product.specs_rental.land_owner || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Palette className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Structure Color</p>
                        <p className="font-medium">{product.specs_rental.structure_color || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Contractor</p>
                        <p className="font-medium">{product.specs_rental.structure_contractor || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Condition</p>
                        <p className="font-medium">{product.specs_rental.structure_condition || "Not specified"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:col-span-2">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Last Maintenance</p>
                        <p className="font-medium">
                          {product.specs_rental.structure_last_maintenance || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="audience" className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Target Audience</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Age Groups</p>
                      <div className="flex flex-wrap gap-2">
                        {product.specs_rental.audience.age_groups.map((age) => (
                          <Badge key={age} variant="outline">
                            {age}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Interests</p>
                      <div className="flex flex-wrap gap-2">
                        {product.specs_rental.audience.interests.map((interest) => (
                          <Badge key={interest} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Demographics</p>
                      <div className="flex flex-wrap gap-2">
                        {product.specs_rental.audience.demographics.map((demo) => (
                          <Badge key={demo} variant="outline">
                            {demo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="traffic" className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Traffic Data</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Daily Impressions</p>
                        <p className="font-medium">
                          {product.specs_rental.traffic_data.daily_impressions.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Car className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Daily Vehicle Count</p>
                        <p className="font-medium">
                          {product.specs_rental.traffic_data.vehicle_count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Peak Hours</p>
                    <div className="flex flex-wrap gap-2">
                      {product.specs_rental.traffic_data.peak_hours.map((hour) => (
                        <Badge key={hour} variant="outline">
                          {hour}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {product.content_type === "dynamic" && (
                  <TabsContent value="dynamic" className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold mb-4">Dynamic Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Loop Duration</p>
                          <p className="font-medium">{product.specs_rental.loop_duration}s</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Spots per Loop</p>
                          <p className="font-medium">{product.specs_rental.spots_per_loop}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Spot Duration</p>
                          <p className="font-medium">{product.specs_rental.spot_duration}s</p>
                        </div>
                      </div>
                    </div>

                    {product.specs_rental.operating_hours && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Operating Hours</p>
                        <p className="font-medium">
                          {product.specs_rental.operating_hours.start} - {product.specs_rental.operating_hours.end}
                        </p>
                      </div>
                    )}

                    {product.specs_rental.brightness_schedule && (
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Brightness Schedule</p>
                        <div className="space-y-2">
                          {product.specs_rental.brightness_schedule.map((schedule, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{schedule.time_range}</span>
                              <span className="text-sm font-medium">{schedule.brightness}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Site Owner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Site Owner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{product.site_owner}</p>
                <p className="text-sm text-gray-600">Owner</p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Rental Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Daily</span>
                  <span className="font-medium">{formatCurrency(product.specs_rental.rental_rates.daily)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Weekly</span>
                  <span className="font-medium">{formatCurrency(product.specs_rental.rental_rates.weekly)}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly</span>
                  <span className="font-medium">{formatCurrency(product.specs_rental.rental_rates.monthly)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Information */}
          <Card>
            <CardHeader>
              <CardTitle>Site Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium">{formatDate(product.created)}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Seller</p>
                  <p className="font-medium">{product.seller_name}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="font-medium text-sm">{product.specs_rental.location}</p>
                </div>
                {product.specs_rental.geopoint && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-600">Coordinates</p>
                      <p className="font-medium text-sm">
                        {product.specs_rental.geopoint[0].toFixed(6)}, {product.specs_rental.geopoint[1].toFixed(6)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" variant="default">
                  Create Job Order
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  Schedule Maintenance
                </Button>
                <Button className="w-full bg-transparent" variant="outline">
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
