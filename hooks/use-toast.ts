"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner" // Import sonner's toast function
import type { ToastProps } from "@/components/ui/toast" // Import ToastProps from components/ui/toast.tsx

/**
 * @typedef {Object} ToastContextType
 * @property {(props: ToastProps) => void} toast - Function to display a toast notification.
 */
interface ToastContextType {
  toast: (props: ToastProps) => void
}

/**
 * Context for the toast system.
 * @type {React.Context<ToastContextType | undefined>}
 */
const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

/**
 * Provides the toast context to its children.
 * This component should wrap your application or the part of your application
 * where you want to use toast notifications.
 * @param {Object} { children } - The props for the component.
 * @param {React.ReactNode} children - The child components to be wrapped by the provider.
 * @returns {JSX.Element} The ToastContext.Provider wrapping children.
 */
// This ToastProvider is now a simple wrapper that provides the sonner toast function.
// The actual Radix ToastProvider is exported from components/ui/toast.tsx
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showToast = React.useCallback((props: ToastProps) => {
    // Map your custom variant to sonner's toast types or handle styling via classNames
    if (props.variant === "destructive") {
      sonnerToast.error(props.title, {
        description: props.description,
        action: props.action,
        duration: props.duration,
        className: props.className,
      })
    } else {
      sonnerToast(props.title, {
        description: props.description,
        action: props.action,
        duration: props.duration,
        className: props.className,
      })
    }
  }, [])

  const value = React.useMemo(() => ({ toast: showToast }), [showToast])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

/**
 * Custom hook to consume the toast context.
 * @returns {ToastContextType} The toast context with the toast function.
 * @throws {Error} If used outside of a ToastProvider.
 */
export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
