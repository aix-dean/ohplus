"use client"

import { SalesRecordTable } from "@/components/accounting/sales-record-table"

export default function SalesRecordPage() {
  return (
    <div className="flex-1 p-4 md:p-6">
      <SalesRecordTable />
    </div>
  )
}
