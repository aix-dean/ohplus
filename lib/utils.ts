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

export function safeToDate(dateValue: any): Date {
  if (!dateValue) {
    return new Date()
  }

  // If it's already a Date object, return it
  if (dateValue instanceof Date) {
    return dateValue
  }

  // If it's a Firestore Timestamp, convert it
  if (dateValue && typeof dateValue.toDate === "function") {
    return dateValue.toDate()
  }

  // If it's a string or number, try to parse it
  const parsed = new Date(dateValue)

  // Check if the parsed date is valid
  if (isNaN(parsed.getTime())) {
    return new Date() // Return current date as fallback
  }

  return parsed
}
