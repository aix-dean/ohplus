"use client"

import { ToastAction } from "@/components/ui/toast"
import { toast } from "@/components/ui/use-toast"

export function useToast() {
  return {
    toast,
    ToastAction,
  }
}
