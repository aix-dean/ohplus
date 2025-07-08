import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { AssistantProvider } from "@/components/ai-assistant/assistant-provider"
import { Toaster } from "@/components/ui/toaster" // Correctly import Toaster from components/ui/toaster
import { ToastProvider, ToastViewport } from "@/components/ui/toast" // Import Radix ToastProvider and ToastViewport

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
            <ToastProvider>
              {" "}
              {/* Radix ToastProvider for useToast hook */}
              <div className="flex flex-col h-screen">{children}</div>
              <AssistantProvider />
              <Toaster /> {/* Sonner Toaster for display */}
              <ToastViewport /> {/* Radix ToastViewport for positioning */}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
