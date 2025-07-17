import { Loader2 } from "lucide-react"
import { SideNavigation } from "@/components/side-navigation"

export default function BusinessInventoryDetailLoading() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <SideNavigation />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    </div>
  )
}
