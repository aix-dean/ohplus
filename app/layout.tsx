import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster" // Correctly import Toaster from components/ui/toaster

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ERP v2",
  description: "Enterprise Resource Planning system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            {children}
            <Toaster /> {/* Render the Toaster component here */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
