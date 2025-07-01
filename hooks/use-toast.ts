import * as React from "react"

import { ToastAction } from "@/components/ui/toast"
import { toast as showToast } from "@/components/ui/use-toast" // Renamed to avoid conflict

export function useToast() {
  const toast = React.useCallback(
    ({
      title,
      description,
      action,
      variant,
      duration = 5000,
    }: {
      title: string
      description?: string
      action?: React.ReactElement<typeof ToastAction>
      variant?: "default" | "destructive"
      duration?: number
    }) => {
      showToast({
        title,
        description,
        action,
        variant,
        duration,
      })
    },
    [],
  )

  return { toast }
}
