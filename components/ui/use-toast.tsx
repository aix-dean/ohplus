"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

type ToastContextType = {
  toast: ({ title, description, variant }: ToastProps) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback(({ title, description, variant }: ToastProps) => {
    if (variant === "destructive") {
      return sonnerToast.error(title, {
        description,
      })
    }
    return sonnerToast.success(title, {
      description,
    })
  }, [])

  return <ToastContext.Provider value={{ toast }}>{children}</ToastContext.Provider>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
