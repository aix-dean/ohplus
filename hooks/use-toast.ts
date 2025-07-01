"use client"

import * as React from "react"
import { toast as showToast } from "@/components/ui/use-toast"

export function useToast() {
  const toast = React.useCallback(({ title, description, action, ...props }: Parameters<typeof showToast>[0]) => {
    showToast({
      title,
      description,
      action,
      ...props,
    })
  }, [])

  return { toast }
}
