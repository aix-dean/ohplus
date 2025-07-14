import type React from "react"
import CMSBreadcrumb from "@/components/cms-breadcrumb"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <CMSBreadcrumb currentPage="dashboard" />
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
