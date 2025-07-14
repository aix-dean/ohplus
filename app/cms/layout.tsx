import type React from "react"
import { CMSBreadcrumb } from "@/components/cms-breadcrumb"

export default function CMSLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-64 bg-gray-200 p-4">
        {/* Sidebar content */}
        Sidebar
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white p-4">
          {/* Header content */}
          Header
        </header>
        <main className="flex-1 p-6">
          <CMSBreadcrumb />
          {children}
        </main>
      </div>
    </div>
  )
}
