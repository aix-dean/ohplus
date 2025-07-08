import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import AuthLayout from "./auth-layout"
import { AssistantProvider } from "@/components/ai-assistant/assistant-provider"
import { ToastProvider, Toaster, ToastViewport } from "@/components/ui/toast" // Import all from components/ui/toast

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OH Plus",
  description: "Manage your outdoor advertising sites",
  icons: {
    icon: "/oh-plus-logo.png",
  },
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AuthLayout>
            <ToastProvider>
              <ToastViewport /> {/* Render ToastViewport from Radix */}
              <div className="flex flex-col h-screen">{children}</div>
              <AssistantProvider />
              <Toaster /> {/* Render Sonner Toaster */}
            </ToastProvider>
          </AuthLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
