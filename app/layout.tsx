import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { TourProvider } from "@/contexts/tour-context" // Import TourProvider
import { TourOverlay } from "@/components/tour-overlay" // Import TourOverlay

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OH!PLUS",
  description: "Out-of-Home Advertising Platform",
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
            <TourProvider>
              {" "}
              {/* Wrap with TourProvider */}
              {children}
              <TourOverlay /> {/* Render TourOverlay */}
            </TourProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
