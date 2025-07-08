"use client"

import * as React from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  action?: React.ReactNode
}

type ToasterToast = ToastProps & {
  id: string
  open: boolean
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case actionTypes.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case actionTypes.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
      }

    case actionTypes.DISMISS_TOAST:
      const { toastId } = action
      // ! Side effect ! - This will be executed in the reducer
      if (toastId) {
        return {
          ...state,
          toasts: state.toasts.map((t) => (t.id === toastId ? { ...t, open: false } : t)),
        }
      } else {
        return {
          ...state,
          toasts: state.toasts.map((t) => ({ ...t, open: false })),
        }
      }

    case actionTypes.REMOVE_TOAST:
      if (action.toastId) {
        return {
          ...state,
          toasts: state.toasts.filter((t) => t.id !== action.toastId),
        }
      }
      return {
        ...state,
        toasts: [],
      }
    default:
      return state
  }
}

const ToastContext = React.createContext<
  | {
      toasts: ToasterToast[]
      toast: ({ ...props }: ToastProps) => {
        id: string
        dismiss: () => void
        update: (props: Partial<ToasterToast>) => void
      }
    }
  | undefined
>(undefined)

export function ToasterProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(reducer, { toasts: [] })

  const addToast = React.useCallback(
    (toast: ToasterToast) => {
      dispatch({ type: "ADD_TOAST", toast })
    },
    [dispatch],
  )

  const updateToast = React.useCallback(
    (toast: Partial<ToasterToast>) => {
      dispatch({ type: "UPDATE_TOAST", toast })
    },
    [dispatch],
  )

  const dismissToast = React.useCallback(
    (toastId?: ToasterToast["id"]) => {
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
    [dispatch],
  )

  const removeToast = React.useCallback(
    (toastId?: ToasterToast["id"]) => {
      dispatch({ type: "REMOVE_TOAST", toastId })
    },
    [dispatch],
  )

  React.useEffect(() => {
    state.toasts.forEach((toast) => {
      if (toast.open === false) {
        // We use a timeout to allow the toast to animate out before being removed
        const timer = setTimeout(() => {
          removeToast(toast.id)
        }, TOAST_REMOVE_DELAY)
        return () => clearTimeout(timer)
      }
    })
  }, [state.toasts, removeToast])

  const toastFunction = React.useCallback(({ title, description, variant, action }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        action,
      })
    } else {
      sonnerToast.success(title, {
        description,
        action,
      })
    }
  }, [])

  const value = React.useMemo(
    () => ({
      toasts: state.toasts,
      toast: toastFunction,
    }),
    [state.toasts, toastFunction],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToastHook() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastHook must be used within a ToasterProvider")
  }
  return context
}

const toast = ({ title, description, variant, action }: ToastProps) => {
  if (variant === "destructive") {
    sonnerToast.error(title, {
      description,
      action,
    })
  } else {
    sonnerToast.success(title, {
      description,
      action,
    })
  }
}

// Export a useToast hook for backward compatibility to prevent breaking changes.
const useToast = () => {
  return { toast }
}

export { useToast, toast }
