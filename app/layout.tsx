import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { TourProvider } from "@/contexts/tour-context"
import { TourOverlay } from "@/components/tour-overlay"
import AuthLayout from "./auth-layout"
import { AssistantProvider } from "@/components/ai-assistant/assistant-provider"
import { ToasterProvider } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

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
          <TourProvider>
            <AuthLayout>
              <ToasterProvider>
                <div className="flex flex-col h-screen">{children}</div>
                <Toaster />
                <AssistantProvider />
              </ToasterProvider>
            </AuthLayout>
            <TourOverlay />
          </TourProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
