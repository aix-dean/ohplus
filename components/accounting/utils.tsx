"use client"

export type Numberish = number | string

export function parseNumber(value: Numberish | undefined | null): number {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return isFinite(value) ? value : 0
  const cleaned = String(value).replace(/,/g, "").trim()
  const n = Number(cleaned)
  return isFinite(n) ? n : 0
}

export function formatCurrency(value: Numberish, opts: Intl.NumberFormatOptions = {}) {
  const n = parseNumber(value)
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    ...opts,
  }).format(n)
}

export function formatNumber(value: Numberish, opts: Intl.NumberFormatOptions = {}) {
  const n = parseNumber(value)
  return new Intl.NumberFormat("en-PH", {
    maximumFractionDigits: 2,
    ...opts,
  }).format(n)
}

export function sumBy<T>(arr: T[], pick: (row: T) => number): number {
  return arr.reduce((acc, r) => acc + (isFinite(pick(r)) ? pick(r) : 0), 0)
}

export function includesAny(haystack: unknown, needle: string) {
  if (!needle) return true
  const flat = JSON.stringify(haystack ?? "").toLowerCase()
  return flat.includes(needle.toLowerCase())
}

export function uid(prefix = "row") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`
}
