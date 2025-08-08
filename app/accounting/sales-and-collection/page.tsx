"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SalesAndCollectionPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales and Collection</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is a placeholder for the Sales and Collection module. Add AR aging, receipts, and matching here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
