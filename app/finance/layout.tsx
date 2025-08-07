import { SideNavigation } from "@/components/side-navigation"

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-[calc(100vh-64px)]">
      <SideNavigation />
      {children}
    </div>
  )
}
