export const parseNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0
  if (typeof value === "number") return isNaN(value) ? 0 : value
  if (typeof value === "string") {
    const cleaned = value.replace(/[₱,\s]/g, "")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount)
}

export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const includesAny = (obj: any, query: string): boolean => {
  if (!query) return true
  const searchQuery = query.toLowerCase()
  return Object.values(obj).some((value) => String(value).toLowerCase().includes(searchQuery))
}

export const sumBy = <T>(array: T[], accessor: (item: T) => number): number => {\
  return array.reduce((sum, item) => sum + accessor(item), 0)
}\
