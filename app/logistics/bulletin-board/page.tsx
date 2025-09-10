"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Construction, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LogisticsBulletinBoard() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Construction className="h-16 w-16 text-orange-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              The Logistics Bulletin Board is currently under development. We're working hard to bring you this feature
              soon!
            </p>
            <Button
              asChild
              variant="ghost"
              className="w-full group hover:bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 transition-all duration-200"
            >
              <Link
                href="/logistics/dashboard"
                className="flex items-center justify-center gap-2 text-gray-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
