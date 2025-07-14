"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore"
import { Loader2, Copy, Eye, EyeOff, Users, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GenerateInvitationCodeDialog } from "@/components/generate-invitation-code-dialog"
import { InvitationCodeDetailsDialog } from "@/components/invitation-code-details-dialog"
import { useRouter } from "next/navigation"
import { subscriptionService } from "@/lib/subscription-service"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface InvitationCode {
  id: string
  code: string
  description: string
  usageLimit: number
  usedCount: number
  expirationDate: any
  role: string
  createdBy: string
  licenseKey: string
  createdAt: any
  isActive: boolean
}

export default function InvitationCodesPage() {
  const { user, userData, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [invitationCodes, setInvitationCodes] = useState<InvitationCode[]>([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [showCodes, setShowCodes] = useState<{ [key: string]: boolean }>({})
  const [selectedCode, setSelectedCode] = useState<InvitationCode | null>(null)
  const [userLimitInfo, setUserLimitInfo] = useState<{
    canInvite: boolean
    currentUsers: number
    maxUsers: number
  } | null>(null)
  const [loadingUserLimits, setLoadingUserLimits] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [loading, user, router])

  // Fetch user limit information
  useEffect(() => {
    const fetchUserLimits = async () => {
      if (!userData?.license_key) {
        setLoadingUserLimits(false)
        return
      }

      try {
        const limitInfo = await subscriptionService.checkUserLimit(userData.license_key)
        setUserLimitInfo(limitInfo)
      } catch (error) {
        console.error("Error fetching user limits:", error)
        toast({
          title: "Error",
          description: "Failed to fetch user limits",
          variant: "destructive",
        })
      } finally {
        setLoadingUserLimits(false)
      }
    }

    fetchUserLimits()
  }, [userData?.license_key, toast])

  useEffect(() => {
    if (!userData?.license_key) return

    const q = query(
      collection(db, "invitation_codes"),
      where("licenseKey", "==", userData.license_key),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const codes: InvitationCode[] = []
      querySnapshot.forEach((doc) => {
        codes.push({ id: doc.id, ...doc.data() } as InvitationCode)
      })
      setInvitationCodes(codes)
      setLoadingCodes(false)
    })

    return () => unsubscribe()
  }, [userData?.license_key])

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied!",
      description: "Invitation code copied to clipboard.",
    })
  }

  const toggleCodeVisibility = (codeId: string) => {
    setShowCodes((prev) => ({
      ...prev,
      [codeId]: !prev[codeId],
    }))
  }

  const toggleCodeStatus = async (codeId: string, currentStatus: boolean) => {
    try {
      const codeRef = doc(db, "invitation_codes", codeId)
      await updateDoc(codeRef, {
        isActive: !currentStatus,
      })

      toast({
        title: "Success",
        description: `Invitation code ${!currentStatus ? "activated" : "deactivated"}.`,
      })
    } catch (error) {
      console.error("Error updating code status:", error)
      toast({
        title: "Error",
        description: "Failed to update invitation code status.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isExpired = (expirationDate: any) => {
    if (!expirationDate) return false
    const expDate = expirationDate.toDate ? expirationDate.toDate() : new Date(expirationDate)
    return new Date() > expDate
  }

  const getStatusBadge = (code: InvitationCode) => {
    if (!code.isActive) {
      return <Badge variant="secondary">Inactive</Badge>
    }
    if (isExpired(code.expirationDate)) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (code.usedCount >= code.usageLimit) {
      return <Badge variant="outline">Used Up</Badge>
    }
    return (
      <Badge variant="default" className="bg-green-500">
        Active
      </Badge>
    )
  }

  if (loading || loadingCodes || loadingUserLimits) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  const remainingSlots =
    userLimitInfo && userLimitInfo.maxUsers !== -1 ? userLimitInfo.maxUsers - userLimitInfo.currentUsers : null

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitation Codes</h1>
              <p className="mt-2 text-gray-600">Manage invitation codes to invite new users to your organization.</p>
            </div>
            <GenerateInvitationCodeDialog
              onCodeGenerated={() => {
                // Refresh user limits after generating a code
                if (userData?.license_key) {
                  subscriptionService.checkUserLimit(userData.license_key).then(setUserLimitInfo)
                }
              }}
            />
          </div>
        </div>

        {/* User Limit Status Card */}
        {userLimitInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                User Limit Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {userLimitInfo.currentUsers} / {userLimitInfo.maxUsers === -1 ? "∞" : userLimitInfo.maxUsers} Users
                  </p>
                  <p className="text-sm text-gray-600">
                    {userLimitInfo.maxUsers === -1
                      ? "Unlimited users available"
                      : `${userLimitInfo.maxUsers - userLimitInfo.currentUsers} slots remaining`}
                  </p>
                </div>
                <div className="flex items-center">
                  {userLimitInfo.canInvite ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  )}
                </div>
              </div>

              {!userLimitInfo.canInvite && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have reached the maximum number of users for your subscription plan. Please upgrade your plan to
                    invite more users.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invitation Codes Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {invitationCodes.map((code) => (
            <Card key={code.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{code.description}</CardTitle>
                  {getStatusBadge(code)}
                </div>
                <CardDescription>Created {formatDate(code.createdAt)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 font-mono text-sm bg-gray-100 p-2 rounded">
                    {showCodes[code.id] ? code.code : "••••••••••••••••"}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleCodeVisibility(code.id)}>
                    {showCodes[code.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(code.code)}
                    disabled={!code.isActive || isExpired(code.expirationDate)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Usage</p>
                    <p className="font-semibold">
                      {code.usedCount} / {code.usageLimit}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Role</p>
                    <p className="font-semibold capitalize">{code.role}</p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-gray-600">Expires</p>
                  <p className={`font-semibold ${isExpired(code.expirationDate) ? "text-red-600" : ""}`}>
                    {formatDate(code.expirationDate)}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCode(code)} className="flex-1">
                    View Details
                  </Button>
                  <Button
                    variant={code.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleCodeStatus(code.id, code.isActive)}
                    className="flex-1"
                  >
                    {code.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {invitationCodes.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invitation codes yet</h3>
              <p className="text-gray-600 text-center mb-6">
                Create your first invitation code to start inviting users to your organization.
              </p>
              <GenerateInvitationCodeDialog
                onCodeGenerated={() => {
                  if (userData?.license_key) {
                    subscriptionService.checkUserLimit(userData.license_key).then(setUserLimitInfo)
                  }
                }}
              />
            </CardContent>
          </Card>
        )}

        {selectedCode && (
          <InvitationCodeDetailsDialog
            code={selectedCode}
            open={!!selectedCode}
            onOpenChange={(open) => !open && setSelectedCode(null)}
          />
        )}
      </div>
    </main>
  )
}
