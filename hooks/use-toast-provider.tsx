"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"

// Define the ToastProps type
export type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Define the shape of the context value
interface ToastContextType {
  toast: (props: ToastProps) => void
}

// Create the context
const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

// ToastProvider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = React.useCallback(({ title, description, variant }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
      })
    } else {
      sonnerToast.success(title, {
        description,
      })
    }
  }, [])

  const value = React.useMemo(() => ({ toast: showToast }), [showToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

// useToast hook
export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
