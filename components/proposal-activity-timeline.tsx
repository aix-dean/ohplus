"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, User, Mail, Eye, FileText, Edit, MessageSquare, Plus, MapPin, Globe, Wifi } from "lucide-react"
import { getProposalActivities } from "@/lib/proposal-activity-service"
import type { ProposalActivity } from "@/lib/types/proposal-activity"

interface ProposalActivityTimelineProps {
  proposalId: string
}

const activityIcons = {
  created: Plus,
  status_changed: Edit,
  email_sent: Mail,
  viewed: Eye,
  pdf_generated: FileText,
  updated: Edit,
  comment_added: MessageSquare,
}

const activityColors = {
  created: "bg-green-500",
  status_changed: "bg-blue-500",
  email_sent: "bg-purple-500",
  viewed: "bg-orange-500",
  pdf_generated: "bg-red-500",
  updated: "bg-yellow-500",
  comment_added: "bg-indigo-500",
}

export function ProposalActivityTimeline({ proposalId }: ProposalActivityTimelineProps) {
  const [activities, setActivities] = useState<ProposalActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const fetchedActivities = await getProposalActivities(proposalId)
        setActivities(fetchedActivities)
      } catch (error) {
        console.error("Error fetching activities:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [proposalId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <ScrollArea className="h-full">
          <div className="space-y-6">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]

              return (
                <div key={activity.id} className="relative">
                  {index < activities.length - 1 && <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-200" />}

                  <div className="flex items-start gap-4">
                    <div className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {activity.type.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {activity.performedByName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.timestamp.toLocaleString()}
                        </div>
                      </div>

                      {/* Location Information */}
                      {(activity.location || activity.ipAddress) && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-2">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-600">Location & Network Info</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                            {activity.ipAddress && (
                              <div className="flex items-center gap-1">
                                <Wifi className="h-3 w-3" />
                                <span className="font-mono">{activity.ipAddress}</span>
                              </div>
                            )}

                            {activity.location?.country && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                <span>
                                  {activity.location.city && `${activity.location.city}, `}
                                  {activity.location.region && `${activity.location.region}, `}
                                  {activity.location.country}
                                </span>
                              </div>
                            )}

                            {activity.location?.timezone && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{activity.location.timezone}</span>
                              </div>
                            )}

                            {activity.location?.isp && (
                              <div className="flex items-center gap-1">
                                <Wifi className="h-3 w-3" />
                                <span>{activity.location.isp}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Activity Details */}
                      {Object.keys(activity.details).length > 0 && (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                          {activity.details.oldStatus && activity.details.newStatus && (
                            <p>
                              Changed from <Badge variant="outline">{activity.details.oldStatus}</Badge> to{" "}
                              <Badge variant="outline">{activity.details.newStatus}</Badge>
                            </p>
                          )}
                          {activity.details.emailRecipient && (
                            <p>
                              Sent to: <span className="font-mono">{activity.details.emailRecipient}</span>
                            </p>
                          )}
                          {activity.details.updatedFields && (
                            <p>Updated fields: {activity.details.updatedFields.join(", ")}</p>
                          )}
                          {activity.details.comment && <p className="italic">"{activity.details.comment}"</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {activities.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No activities recorded yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
