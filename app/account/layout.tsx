import type React from "react"
import { SideNavigation } from "@/components/side-navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <div className="flex min-h-screen w-full flex-col">
          {/* Removed TopNavigation component */}
          <main className="flex flex-1">
            <SideNavigation />
            <div className="flex-1">{children}</div>
          </main>
        </div>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  )
}
