"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Loader2, Plus, Users, AlertTriangle } from "lucide-react"
import { subscriptionService } from "@/lib/subscription-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GenerateInvitationCodeDialogProps {
  onCodeGenerated?: () => void
}

export function GenerateInvitationCodeDialog({ onCodeGenerated }: GenerateInvitationCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [checkingLimits, setCheckingLimits] = useState(false)
  const [userLimitInfo, setUserLimitInfo] = useState<{
    canInvite: boolean
    currentUsers: number
    maxUsers: number
  } | null>(null)

  const [formData, setFormData] = useState({
    description: "",
    usageLimit: 1,
    expirationDays: 30,
    role: "user",
  })

  const { toast } = useToast()
  const { user, userData } = useAuth()

  // Check user limits when dialog opens
  useEffect(() => {
    const checkUserLimits = async () => {
      if (!open || !userData?.license_key) return

      setCheckingLimits(true)
      try {
        const limitInfo = await subscriptionService.checkUserLimit(userData.license_key)
        setUserLimitInfo(limitInfo)
      } catch (error) {
        console.error("Error checking user limits:", error)
        toast({
          title: "Error",
          description: "Failed to check user limits",
          variant: "destructive",
        })
      } finally {
        setCheckingLimits(false)
      }
    }

    checkUserLimits()
  }, [open, userData?.license_key, toast])

  const generateCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !userData?.license_key) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate invitation codes.",
        variant: "destructive",
      })
      return
    }

    // Check if user limit allows for new invitations
    if (userLimitInfo && !userLimitInfo.canInvite) {
      toast({
        title: "User Limit Reached",
        description: "You have reached the maximum number of users for your subscription plan.",
        variant: "destructive",
      })
      return
    }

    // Check if usage limit exceeds remaining user slots
    if (userLimitInfo && userLimitInfo.maxUsers !== -1) {
      const remainingSlots = userLimitInfo.maxUsers - userLimitInfo.currentUsers
      if (formData.usageLimit > remainingSlots) {
        toast({
          title: "Usage Limit Too High",
          description: `You can only invite ${remainingSlots} more user${remainingSlots !== 1 ? "s" : ""} with your current plan.`,
          variant: "destructive",
        })
        return
      }
    }

    setIsGenerating(true)

    try {
      const code = generateCode()
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + formData.expirationDays)

      const invitationData = {
        code,
        description: formData.description,
        usageLimit: formData.usageLimit,
        usedCount: 0,
        expirationDate,
        role: formData.role,
        createdBy: user.uid,
        licenseKey: userData.license_key,
        createdAt: serverTimestamp(),
        isActive: true,
      }

      await addDoc(collection(db, "invitation_codes"), invitationData)

      toast({
        title: "Invitation Code Generated",
        description: `Code: ${code}`,
      })

      // Reset form
      setFormData({
        description: "",
        usageLimit: 1,
        expirationDays: 30,
        role: "user",
      })

      setOpen(false)
      onCodeGenerated?.()
    } catch (error) {
      console.error("Error generating invitation code:", error)
      toast({
        title: "Error",
        description: "Failed to generate invitation code. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const isFormDisabled = userLimitInfo && !userLimitInfo.canInvite
  const remainingSlots =
    userLimitInfo && userLimitInfo.maxUsers !== -1 ? userLimitInfo.maxUsers - userLimitInfo.currentUsers : null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Generate Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Invitation Code</DialogTitle>
          <DialogDescription>Create a new invitation code to invite users to your organization.</DialogDescription>
        </DialogHeader>

        {checkingLimits ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking user limits...</span>
          </div>
        ) : (
          <>
            {/* User Limit Status */}
            {userLimitInfo && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Users className="h-4 w-4" />
                  <span>
                    Current Users: {userLimitInfo.currentUsers}
                    {userLimitInfo.maxUsers !== -1 && ` / ${userLimitInfo.maxUsers}`}
                    {userLimitInfo.maxUsers === -1 && " (Unlimited)"}
                  </span>
                </div>

                {!userLimitInfo.canInvite && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You have reached the maximum number of users for your subscription plan. Please upgrade your plan
                      to invite more users.
                    </AlertDescription>
                  </Alert>
                )}

                {userLimitInfo.canInvite && remainingSlots !== null && (
                  <Alert>
                    <Users className="h-4 w-4" />
                    <AlertDescription>
                      You can invite {remainingSlots} more user{remainingSlots !== 1 ? "s" : ""} with your current plan.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter a description for this invitation code..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isFormDisabled}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    min="1"
                    max={remainingSlots || undefined}
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number.parseInt(e.target.value) || 1 })}
                    disabled={isFormDisabled}
                    required
                  />
                  {remainingSlots !== null && (
                    <p className="text-xs text-gray-500">Maximum: {remainingSlots} (based on your plan)</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationDays">Expires in (days)</Label>
                  <Input
                    id="expirationDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.expirationDays}
                    onChange={(e) =>
                      setFormData({ ...formData, expirationDays: Number.parseInt(e.target.value) || 30 })
                    }
                    disabled={isFormDisabled}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Default Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isFormDisabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isGenerating || isFormDisabled}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Code"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
