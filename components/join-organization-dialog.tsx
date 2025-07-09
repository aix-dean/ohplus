"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface JoinOrganizationDialogProps {
  trigger?: React.ReactNode
}

export function JoinOrganizationDialog({ trigger }: JoinOrganizationDialogProps) {
  const [orgCode, setOrgCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [open, setOpen] = useState(false)
  const { joinOrganization, userData } = useAuth()

  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!orgCode.trim()) {
      setError("Please enter an organization code")
      return
    }

    setLoading(true)
    try {
      const result = await joinOrganization(orgCode.trim())

      toast({
        title: "Success!",
        description: result.message,
      })

      setOpen(false)
      setOrgCode("")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" className="flex items-center gap-2 bg-transparent">
      <Users className="h-4 w-4" />
      Join Organization
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Join an Organization</DialogTitle>
          <DialogDescription>
            Enter the organization code provided by your administrator to join their organization.
          </DialogDescription>
        </DialogHeader>

        {userData?.company_id && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You are currently a member of another organization. Joining a new organization will switch your company
              membership.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleJoinOrganization} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="orgCode">Organization Code</Label>
            <Input
              id="orgCode"
              type="text"
              placeholder="Enter organization code (e.g., ABCD-1234)"
              value={orgCode}
              onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
              className="font-mono"
              maxLength={9}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !orgCode.trim()} className="flex-1">
              {loading ? "Joining..." : "Join Organization"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
