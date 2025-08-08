"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SalesRecordPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Sales Record</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is a placeholder for the Sales Record module. Add filters, tables, and exports here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
