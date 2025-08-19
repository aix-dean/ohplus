"use client"

import { useParams } from "next/navigation"

export default function ProposalDetailsPage() {
  const params = useParams()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Proposal Details - {params.id}</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">This is a clean starting point for the proposal details page.</p>
        </div>
      </div>
    </div>
  )
}
