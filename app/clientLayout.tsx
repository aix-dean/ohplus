"use client"

import type React from "react"

import { AuthProvider } from "@/contexts/auth-context"
import { FixedHeader } from "@/components/fixed-header"
import { SideNavigation } from "@/components/side-navigation"
import { AssistantProvider } from "@/components/ai-assistant/assistant-provider"
import { AssistantWidget } from "@/components/ai-assistant/assistant-widget"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AssistantProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <SideNavigation />
          <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
            <FixedHeader />
            {children}
          </div>
          <AssistantWidget />
        </div>
      </AssistantProvider>
    </AuthProvider>
  )
}
