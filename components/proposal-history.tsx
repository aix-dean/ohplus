"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getProposalsByUserId } from "@/lib/proposal-service"
import type { Proposal } from "@/lib/types/proposal"
import { format } from "date-fns"
import { FileText } from "lucide-react"
import Link from "next/link" // Import Link for navigation

export function ProposalHistory() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user?.uid) {
      loadProposals()
    }
  }, [user])

  const loadProposals = async () => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userProposals = await getProposalsByUserId(user.uid)
      setProposals(userProposals)
    } catch (error) {
      console.error("Error loading proposal history:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Proposal History</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No proposals found.</div>
          ) : (
            <div className="space-y-3">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/sales/proposals/${proposal.id}`} // Navigate to the proposal page
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 line-clamp-1">{proposal.title}</div>
                    <div className="text-sm text-gray-500">{format(proposal.createdAt, "MMM d, yyyy")}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
