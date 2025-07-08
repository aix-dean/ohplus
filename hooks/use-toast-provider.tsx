"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"
import type { ToastProps } from "@/components/ui/toast" // Import ToastProps from the UI component
import type { JSX } from "react/jsx-runtime" // Declare JSX variable

/**
 * @typedef {Object} ToastContextType
 * @property {(props: ToastProps) => void} toast - Function to display a toast notification.
 */
type ToastContextType = {
  toast: (props: ToastProps) => void
}

/**
 * Context for the toast system.
 * @type {React.Context<ToastContextType | undefined>}
 */
const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

/**
 * Props for the ToastProvider component.
 * @typedef {Object} ToastProviderProps
 * @property {React.ReactNode} children - The child components to be wrapped by the provider.
 */
interface ToastProviderProps {
  children: React.ReactNode
}

/**
 * Provides the toast context to its children.
 * This component should wrap your application or the part of your application
 * where you want to use toast notifications.
 * @param {ToastProviderProps} { children } - The props for the component.
 * @returns {JSX.Element} The ToastContext.Provider wrapping children.
 */
export function ToastProvider({ children }: ToastProviderProps): JSX.Element {
  const toast = React.useCallback((props: ToastProps) => {
    sonnerToast(props.title, {
      description: props.description,
      action: props.action,
      duration: props.duration,
      // Map variant to sonner's type if needed, or handle custom styling via classNames
      // For simplicity, we'll pass variant as a custom data attribute or handle it via classNames in Toaster
      className: props.className,
      // You might need to map other props from ToastProps to sonnerToast options
    })
  }, [])

  const value = React.useMemo(() => ({ toast }), [toast])

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
