import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export function generateLicenseKey(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let licenseKey = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      licenseKey += "-"
    }
    licenseKey += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return licenseKey
}
