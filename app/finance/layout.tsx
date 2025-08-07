'use client'

import { SideNavigation } from '@/components/side-navigation'

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-background">
      <SideNavigation currentSection="finance" />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
