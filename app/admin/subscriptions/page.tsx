"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/hooks/use-auth"
import type { Subscription } from "@/types"
import { useEffect, useState } from "react"

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const { user, refreshUserData } = useAuth()

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch("/api/admin/subscriptions")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setSubscriptions(data)
      } catch (error) {
        console.error("Failed to fetch subscriptions:", error)
      }
    }

    fetchSubscriptions()
  }, [])

  const handleRefresh = async () => {
    await refreshUserData()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-4">Admin Subscriptions</h1>
      <Button onClick={handleRefresh}>Refresh User Data</Button>
      <Table>
        <TableCaption>A list of your subscriptions.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">User ID</TableHead>
            <TableHead>Plan ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Current Period End</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">{subscription.userId}</TableCell>
              <TableCell>{subscription.planId}</TableCell>
              <TableCell>{subscription.status}</TableCell>
              <TableCell>{subscription.current_period_end}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default AdminSubscriptionsPage
