import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateLicenseKey(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  const segments = 4
  const segmentLength = 4

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segmentLength; j++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    if (i < segments - 1) {
      result += "-"
    }
  }
  return result
}
