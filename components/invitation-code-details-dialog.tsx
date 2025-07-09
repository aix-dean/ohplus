"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Users, Shield, Clock, Hash } from "lucide-react"

interface InvitationCode {
  id: string
  code: string
  usage_count: number
  max_usage: number | null
  expires_at: Date
  status: "active" | "inactive" | "expired"
  role: string
  permissions: string[]
  created_at: Date
  created_by: string
  used_by?: string[]
}

interface InvitationCodeDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  code: InvitationCode
}

const PERMISSION_LABELS: Record<string, string> = {
  read_proposals: "Read Proposals",
  write_proposals: "Write Proposals",
  read_clients: "Read Clients",
  write_clients: "Write Clients",
  read_inventory: "Read Inventory",
  write_inventory: "Write Inventory",
  read_analytics: "Read Analytics",
  admin_access: "Admin Access",
}

export function InvitationCodeDetailsDialog({ open, onOpenChange, code }: InvitationCodeDetailsDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
      case "inactive":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Inactive</Badge>
      case "expired":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getUsageDisplay = () => {
    if (code.max_usage === null) {
      return `${code.usage_count} (Unlimited)`
    }
    return `${code.usage_count} / ${code.max_usage}`
  }

  const getDaysUntilExpiry = () => {
    const now = new Date()
    const diffTime = code.expires_at.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return "Expired"
    if (diffDays === 0) return "Expires today"
    if (diffDays === 1) return "Expires tomorrow"
    return `${diffDays} days remaining`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Invitation Code Details
          </DialogTitle>
          <DialogDescription>View detailed information about this invitation code</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Code Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Code Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Code</p>
                  <p className="font-mono font-medium text-lg">{code.code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(code.status)}</div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {code.created_at.toLocaleDateString()} at {code.created_at.toLocaleTimeString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expires</p>
                  <p className="font-medium">
                    {code.expires_at.toLocaleDateString()} at {code.expires_at.toLocaleTimeString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{getDaysUntilExpiry()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usage Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Usage Count</p>
                  <p className="font-medium text-lg">{getUsageDisplay()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining Uses</p>
                  <p className="font-medium text-lg">
                    {code.max_usage === null ? "Unlimited" : Math.max(0, code.max_usage - code.usage_count)}
                  </p>
                </div>
              </div>

              {code.used_by && code.used_by.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Used By</p>
                    <div className="space-y-1">
                      {code.used_by.map((userId, index) => (
                        <div key={index} className="text-sm bg-muted p-2 rounded">
                          User ID: {userId}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Role & Permissions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Role & Permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Role</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {code.role}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-3">Permissions ({code.permissions.length})</p>
                <div className="grid grid-cols-1 gap-2">
                  {code.permissions.map((permission) => (
                    <div key={permission} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{PERMISSION_LABELS[permission] || permission}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Code Created</p>
                    <p className="text-xs text-muted-foreground">
                      {code.created_at.toLocaleDateString()} at {code.created_at.toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {code.usage_count > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">First Use</p>
                      <p className="text-xs text-muted-foreground">
                        Used {code.usage_count} time{code.usage_count > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${code.status === "expired" ? "bg-red-500" : "bg-gray-300"}`}
                  ></div>
                  <div>
                    <p className="text-sm font-medium">{code.status === "expired" ? "Expired" : "Will Expire"}</p>
                    <p className="text-xs text-muted-foreground">
                      {code.expires_at.toLocaleDateString()} at {code.expires_at.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
