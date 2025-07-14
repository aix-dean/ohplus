"use client"

import { useAuth } from "@/contexts/auth-context"
import { QuotationsList } from "@/components/quotations-list"

export default function SalesQuotationsPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Quotations</h1>
        {user?.uid ? (
          <QuotationsList userId={user.uid} />
        ) : (
          <p className="text-center py-10 text-gray-600">Please log in to view your quotations.</p>
        )}
      </div>
    </div>
  )
}
