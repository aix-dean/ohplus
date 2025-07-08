"use client"

import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      toastOptions={{
        classNames: {
          error:
            "group toast group-[.toaster]:bg-red-400 group-[.toaster]:text-red-50 group-[.toaster]:border-red-600 group-[.toaster]:shadow-lg",
          success:
            "group toast group-[.toaster]:bg-green-400 group-[.toaster]:text-green-50 group-[.toaster]:border-green-600 group-[.toaster]:shadow-lg",
          warning:
            "group toast group-[.toaster]:bg-yellow-400 group-[.toaster]:text-yellow-50 group-[.toaster]:border-yellow-600 group-[.toaster]:shadow-lg",
          info: "group toast group-[.toaster]:bg-blue-400 group-[.toaster]:text-blue-50 group-[.toaster]:border-blue-600 group-[.toaster]:shadow-lg",
          actionButton: "group-[.toast]:bg-blue-500 group-[.toast]:text-white",
          cancelButton: "group-[.toast]:bg-gray-200 group-[.toast]:text-gray-800",
        },
      }}
    />
  )
}
