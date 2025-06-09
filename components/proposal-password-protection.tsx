"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, Eye, EyeOff, Shield } from "lucide-react"
import Image from "next/image"

interface ProposalPasswordProtectionProps {
  onPasswordVerified: (proposal: any) => void
  proposalId: string
  isLoading?: boolean
}

export function ProposalPasswordProtection({
  onPasswordVerified,
  proposalId,
  isLoading = false,
}: ProposalPasswordProtectionProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim()) {
      setError("Please enter the access code")
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const response = await fetch(`/api/proposals/public/${proposalId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password.trim().toUpperCase() }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          setError("Invalid access code. Please check your email for the correct code.")
        } else {
          setError(data.error || "Failed to verify access code")
        }
        return
      }

      if (data.success && data.proposal) {
        // Convert date strings back to Date objects
        const proposal = {
          ...data.proposal,
          createdAt: new Date(data.proposal.createdAt),
          updatedAt: new Date(data.proposal.updatedAt),
          validUntil: new Date(data.proposal.validUntil),
        }
        onPasswordVerified(proposal)
      } else {
        setError("Invalid response from server")
      }
    } catch (error) {
      console.error("Error verifying password:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase() // Auto-convert to uppercase
    setPassword(value)
    if (error) setError(null) // Clear error when user starts typing
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Image src="/oh-plus-logo.png" alt="OH+ Logo" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Proposal Access</h1>
          <p className="text-gray-600">This proposal is protected. Please enter your access code to continue.</p>
        </div>

        {/* Password Form */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Enter Access Code</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Access Code</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Enter 8-character code"
                    className="pr-10 font-mono text-center text-lg tracking-wider"
                    maxLength={8}
                    autoComplete="off"
                    disabled={isVerifying}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isVerifying}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  The access code was sent to your email. It's an 8-character code with letters and numbers.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isVerifying || !password.trim()}
              >
                {isVerifying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Access Proposal
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Need help?</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>📧 Check your email for the access code</p>
                  <p>🔄 Contact sales@oohoperator.com if you need assistance</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Shield className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-700">Your proposal is secured with industry-standard protection</span>
          </div>
        </div>
      </div>
    </div>
  )
}
