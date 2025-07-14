"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
}

interface CMSBreadcrumbProps {
  currentPage: string
  productId?: string
  productName?: string
}

export default function CMSBreadcrumb({ currentPage, productId, productName }: CMSBreadcrumbProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  useEffect(() => {
    const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/cms/dashboard" }]

    if (currentPage === "details" && productId) {
      items.push({
        label: productName || "Product Details",
        href: `/cms/details/${productId}`,
      })
    }

    setBreadcrumbs(items)
  }, [currentPage, productId, productName])

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500">
      <Link href="/cms/dashboard" className="flex items-center hover:text-gray-700">
        <Home size={16} className="mr-1" />
        CMS
      </Link>
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight size={14} className="mx-2" />
          <Link href={item.href} className="hover:text-gray-700">
            {item.label}
          </Link>
        </div>
      ))}
    </nav>
  )
}
