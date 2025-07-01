import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export function SalesBreadcrumbHeader() {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
      <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/admin/dashboard">Admin</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/sales/dashboard">Sales-Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
    </div>
  )
}
