"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EncashmentPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Encashment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is a placeholder for the Encashment module. Add approvals and logs here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
