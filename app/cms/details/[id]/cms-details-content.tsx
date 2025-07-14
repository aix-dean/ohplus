"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Edit, Share2, Play, Pause, RotateCcw, Clock, MapPin, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/hooks/use-toast"
import type { Product, ServiceAssignment } from "@/lib/firebase-service"

// Tab Components - using default imports
import ProgramListTab from "./tabs/program-list-tab"
import ServiceTab from "./tabs/service-tab"
import ControlsTab from "./tabs/controls-tab"
import TimelineTab from "./tabs/timeline-tab"

interface CMSDetailsContentProps {
  product: Product
  serviceAssignments: ServiceAssignment[]
}

export default function CMSDetailsContent({ product, serviceAssignments }: CMSDetailsContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("timeline")
  const [isPlaying, setIsPlaying] = useState(false)

  // Get product display name and info
  const displayName = product.name || "Untitled Content"
  const productId = product.id?.substring(0, 8).toUpperCase() || "UNKNOWN"
  const location = product.specs_rental?.location || "Unknown Location"
  const operation = product.campaign_name || "Unassigned Campaign"
  const displayHealth = product.active ? "ON" : "OFF"

  // Mock CMS data - in real app this would come from the product
  const cmsData = product.cms || {
    start_time: "08:00",
    end_time: "22:00",
    spot_duration: 30,
    loops_per_day: 24,
    spots_per_loop: 6,
  }

  // Handle navigation back
  const handleBack = () => {
    router.push("/cms/dashboard")
  }

  // Handle edit
  const handleEdit = () => {
    router.push(`/cms/content/edit/${product.id}`)
  }

  // Handle share
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link Copied",
        description: "The link has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Share Failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
    toast({
      title: isPlaying ? "Display Paused" : "Display Playing",
      description: isPlaying ? "Content playback has been paused." : "Content playback has been resumed.",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-16 rounded-lg overflow-hidden">
                <Image
                  src={product.media?.[0]?.url || "/abstract-geometric-sculpture.png"}
                  alt={displayName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{displayName}</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>ID: {productId}</span>
                  <span>•</span>
                  <span>{location}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              className="flex items-center gap-2 bg-transparent"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2 bg-transparent"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit} className="flex items-center gap-2 bg-transparent">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Info Panel */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 space-y-4">
          {/* Display Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Display Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Health</span>
                <Badge variant={displayHealth === "ON" ? "default" : "secondary"}>{displayHealth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Operation</span>
                <span className="text-sm font-medium">{operation}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge variant={product.status === "Published" ? "default" : "secondary"}>
                  {product.status || "Draft"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Location Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{location}</p>
                  <p className="text-xs text-gray-500">Primary Location</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{operation}</p>
                  <p className="text-xs text-gray-500">Current Operation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">
                    {cmsData.start_time} - {cmsData.end_time}
                  </p>
                  <p className="text-xs text-gray-500">Operating Hours</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{cmsData.loops_per_day} loops/day</p>
                  <p className="text-xs text-gray-500">Loop Frequency</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Play className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">{cmsData.spot_duration}s per spot</p>
                  <p className="text-xs text-gray-500">Spot Duration</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Assignments */}
          {serviceAssignments.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Service Team</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {serviceAssignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignment.assigned_to_avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {assignment.assigned_to_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{assignment.assigned_to_name}</p>
                      <p className="text-xs text-gray-500">{assignment.service_type}</p>
                    </div>
                  </div>
                ))}
                {serviceAssignments.length > 3 && (
                  <p className="text-xs text-gray-500">+{serviceAssignments.length - 3} more assignments</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="controls">Controls</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <TimelineTab product={product} cmsData={cmsData} />
            </TabsContent>

            <TabsContent value="programs" className="mt-6">
              <ProgramListTab product={product} />
            </TabsContent>

            <TabsContent value="service" className="mt-6">
              <ServiceTab product={product} serviceAssignments={serviceAssignments} />
            </TabsContent>

            <TabsContent value="controls" className="mt-6">
              <ControlsTab product={product} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
