import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import AuthLayout from "./auth-layout"
import { AssistantProvider } from "@/components/ai-assistant/assistant-provider"
import { ThemeProvider } from "@/components/theme-provider"
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
          <AuthProvider>
            <AuthLayout>
              <div className="flex flex-col h-screen">{children}</div>
              <AssistantProvider />
              <Toaster />
            </AuthLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
