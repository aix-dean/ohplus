import Link from "next/link"
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SideNavigation } from "@/components/side-navigation"
import { TopNavigation } from "@/components/top-navigation"
import { AuthProvider } from "@/contexts/auth-context"
import { ToasterProvider } from "@/components/ui/use-toast" // Corrected import for ToasterProvider
import { Toaster } from "@/components/ui/toaster"
import { TourProvider } from "@/contexts/tour-context"
import { TourOverlay } from "@/components/tour-overlay"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OOH Operator",
  description: "Out-of-Home Advertising Management Platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <ToasterProvider>
              {" "}
              {/* Correctly wrap Toaster with ToasterProvider */}
              <TourProvider>
                <div className="flex min-h-screen w-full flex-col bg-muted/40">
                  <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
                    <div className="flex h-16 items-center border-b px-4 lg:px-6">
                      <Link href="/" className="flex items-center gap-2 font-semibold">
                        <img src="/ohplus-new-logo.png" alt="OOH Operator Logo" className="h-8" />
                        <span className="sr-only">OOH Operator</span>
                      </Link>
                    </div>
                    <div className="flex-1 overflow-auto py-2">
                      <SideNavigation />
                    </div>
                  </aside>
                  <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                    <TopNavigation />
                    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
                      {children}
                    </main>
                  </div>
                </div>
                <TourOverlay />
              </TourProvider>
              <Toaster />
            </ToasterProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
