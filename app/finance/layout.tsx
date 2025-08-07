import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <SideNavigation />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
