import { Toaster } from "@/components/ui/sonner"
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { ToasterProvider } from "@/hooks/use-toast" // Corrected import path
import { AuthProvider } from "@/contexts/auth-context"
import { TourProvider } from "@/contexts/tour-context"
import { TourOverlay } from "@/components/tour-overlay"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ToasterProvider>
            <AuthProvider>
              <TourProvider>
                {children}
                <TourOverlay />
              </TourProvider>
            </AuthProvider>
            <Toaster />
          </ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
