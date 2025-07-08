"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"
import type { ToastProps } from "@/components/ui/toast" // Import ToastProps from the actual toast component

// Define the shape of the context value
interface ToastContextType {
  toast: (props: ToastProps) => void
}

// Create the context
const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

/**
 * Provides a toast context to its children, allowing them to trigger toast notifications.
 * This component should wrap the part of your application where you want to use toasts.
 * @param {React.ReactNode} children - The child components to be wrapped by the provider.
 */
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

/**
 * A React hook to consume the toast context.
 * Throws an error if used outside of a ToastProvider.
 * @returns {ToastContextType} The toast context, containing the `toast` function.
 */
export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
