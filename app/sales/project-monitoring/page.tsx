"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProjectMonitoringPage() {
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
            <span className="text-lg font-medium">Project Bulletins</span>
          </button>
        </div>
      </div>
    </div>
  )
}
