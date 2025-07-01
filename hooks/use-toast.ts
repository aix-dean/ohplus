"use client"

import * as React from "react"

import { ToastAction } from "@/components/ui/toast"
import { toast as showToast } from "@/components/ui/use-toast"

export function useToast() {
  const toast = React.useCallback(({ title, description, action, ...props }: Parameters<typeof showToast>[0]) => {
    showToast({
      title,
      description,
      action: action ? <ToastAction altText={action.altText}>{action.label}</ToastAction> : undefined,
      ...props,
    })
  }, [])

  return { toast }
}
