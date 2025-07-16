"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LogisticsBulletinBoard() {
  return (
    <div className="container mx-auto p-6">
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4">
              <Construction className="h-16 w-16 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              The Logistics Bulletin Board is currently under development. We're working hard to bring you this feature
              soon!
            </p>
            <p className="text-sm text-gray-500">
              This page will allow you to manage and monitor all your sites in one place.
            </p>
            <Button asChild className="mt-6">
              <Link href="/logistics">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Logistics
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
