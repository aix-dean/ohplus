import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { TourProvider } from "@/contexts/tour-context"
import { TourOverlay } from "@/components/tour-overlay"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OOH Operator",
  description: "Out-of-Home Advertising Management Platform",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <TourProvider>
              {children}
              <TourOverlay />
              <Toaster />
            </TourProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
