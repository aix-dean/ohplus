import * as React from "react"

import { toast as defaultToast } from "@/components/ui/use-toast"
import { type ToastActionElement, type ToastProps } from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToastsMap = Map<string, ToastProps>

let toasts: ToastsMap = new Map()
let listeners: Array<(toasts: ToastsMap) => void> = []
let timerRef: ReturnType<typeof setTimeout>

function dispatch(payload: ToastProps) {
  toasts.set(payload.id!, payload)
  listeners.forEach((listener) => listener(toasts))
}

function dismissToast(id?: string) {
  if (id) {
    toasts.delete(id)
  } else {
    toasts.clear()
  }
  listeners.forEach((listener) => listener(toasts))
}

function useToast() {
  const [state, setState] = React.useState<ToastsMap>(toasts)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((listener) => listener !== setState)
    }
  }, [])

  const toast = React.useCallback((props: ToastProps) => {
    const id = props.id || Math.random().toString(36).substring(2, 9)
    dispatch({ ...props, id })
    return { id }
  }, [])

  const dismiss = React.useCallback((id?: string) => {
    dismissToast(id)
  }, [])

  return {
    ...state,
    toast,
    dismiss,
  }
}

export { useToast, dismissToast as toast } // Export useToast and also toast for direct use
