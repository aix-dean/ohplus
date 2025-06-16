"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Clock, XCircle, Info, CalendarDays, FileCheck, Loader2 } from "lucide-react"
import { getCampaigns, type Campaign, type CampaignTimelineEvent } from "@/lib/campaign-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BulletinBoardActivity {
  id: string
  campaignId: string
  campaignName: string
  status: Campaign["status"] // Overall campaign status
  description: string // From timeline event
  timestamp: Date // From timeline event
  user: { name: string; avatar: string } // From timeline event
  type: CampaignTimelineEvent["type"] // For icon mapping
}

// Helper to format date/time
const formatDateTime = (date: Date) => {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// Helper to get status badge variant
const getStatusBadgeVariant = (status: Campaign["status"]) => {
  switch (status) {
    case "campaign_completed":
    case "proposal_accepted":
    case "cost_estimate_approved":
    case "quotation_accepted":
    case "booking_confirmed":
      return "default" // Greenish or primary
    case "campaign_active":
      return "secondary" // Blueish or secondary
    case "proposal_draft":
    case "proposal_sent":
    case "cost_estimate_pending":
    case "cost_estimate_sent":
    case "quotation_pending":
    case "quotation_sent":
      return "outline" // Light gray
    case "proposal_declined":
    case "cost_estimate_declined":
    case "quotation_declined":
    case "campaign_cancelled":
      return "destructive" // Red
    default:
      return "secondary"
  }
}

// Helper to get icon for activity type
const getActivityIcon = (type: CampaignTimelineEvent["type"]) => {
  switch (type) {
    case "proposal_created":
    case "cost_estimate_created":
    case "quotation_created":
      return <FileCheck className="h-4 w-4 text-purple-500" />
    case "proposal_sent":
    case "cost_estimate_sent":
    case "quotation_sent":
      return <Info className="h-4 w-4 text-blue-500" />
    case "proposal_accepted":
    case "cost_estimate_approved":
    case "quotation_accepted":
    case "booking_confirmed":
    case "campaign_completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "proposal_declined":
    case "cost_estimate_declined":
    case "quotation_declined":
    case "campaign_cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "campaign_started":
      return <CalendarDays className="h-4 w-4 text-orange-500" />
    case "note_added":
      return <Info className="h-4 w-4 text-gray-500" />
    default:
      return <Info className="h-4 w-4 text-gray-500" />
  }
}

export default function SalesBulletinBoardPage() {
  const [activities, setActivities] = useState<BulletinBoardActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaignActivities = async () => {
      try {
        setLoading(true)
        const campaigns = await getCampaigns()
        const allActivities: BulletinBoardActivity[] = []

        campaigns.forEach((campaign) => {
          campaign.timeline.forEach((event) => {
            allActivities.push({
              id: event.id,
              campaignId: campaign.id,
              campaignName: campaign.title,
              status: campaign.status, // Use overall campaign status for the badge
              description: event.title, // Use event title as description
              timestamp: event.timestamp,
              user: {
                name: event.userName,
                avatar: `/placeholder.svg?height=32&width=32&query=${encodeURIComponent(event.userName)}`, // Dynamic avatar
              },
              type: event.type,
            })
          })
        })

        // Sort activities by timestamp in descending order (latest first)
        allActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

        setActivities(allActivities)
      } catch (err) {
        console.error("Failed to fetch campaign activities:", err)
        setError("Failed to load bulletin board. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchCampaignActivities()
  }, [])

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:gap-6">
        <h1 className="text-xl md:text-2xl font-bold">Sales Bulletin Board</h1>
        <p className="text-gray-600">Stay updated with the latest project campaign statuses and activities.</p>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Latest Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading activities...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64 text-red-500">
                <XCircle className="h-6 w-6 mr-2" />
                <span>{error}</span>
              </div>
            ) : activities.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <span>No activities found.</span>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)] pr-4">
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4">
                      <div className="flex-shrink-0 pt-1">{getActivityIcon(activity.type)}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">{activity.campaignName}</h3>
                          <Badge variant={getStatusBadgeVariant(activity.status)}>
                            {activity.status.replace(/_/g, " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-2">
                          <Avatar className="h-4 w-4 mr-1">
                            <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                            <AvatarFallback className="bg-gray-200 text-gray-700 text-[0.6rem]">
                              {activity.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{activity.user.name}</span>
                          <Separator orientation="vertical" className="h-3 mx-2" />
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDateTime(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
