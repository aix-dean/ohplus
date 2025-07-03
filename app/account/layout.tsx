import type React from "react"
import { SideNavigation } from "@/components/side-navigation"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/contexts/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import { Mona_Sans as FontSans } from "next/font/google"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

interface AccountLayoutProps {
  children: React.ReactNode
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              {/* Removed TopNavigation component */}
              <div className="flex flex-1">
                <SideNavigation />
                <main className="flex-1 overflow-hidden">{children}</main>
              </div>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
