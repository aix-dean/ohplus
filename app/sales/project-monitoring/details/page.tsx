"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function JobOrderDetailsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-lg font-medium">Job Order Details</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        {/* This page is intentionally left blank as requested */}
        <div className="bg-white rounded-lg border border-gray-300 p-8 text-center">
          <p className="text-gray-500">Job Order Details Page</p>
        </div>
      </div>
    </div>
  )
}
