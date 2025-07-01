import * as React from "react"

import { ToastAction } from "@/components/ui/toast"
import { toast as showToast } from "@/components/ui/use-toast"

export function useToast() {
  const toast = React.useCallback(
    ({
      title,
      description,
      action,
      variant,
    }: {
      title: string
      description?: string
      action?: React.ReactElement<typeof ToastAction>
      variant?: "default" | "destructive"
    }) => {
      showToast({
        title,
        description,
        action,
        variant,
      })
    },
    [],
  )

  return { toast }
}
