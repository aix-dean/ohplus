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

export function getProjectCompliance(quotation: any) {
  console.log("[DEBUG] getProjectCompliance called with quotation:", quotation);
  console.log("[DEBUG] quotation?.projectCompliance:", quotation?.projectCompliance);
  const compliance = quotation?.projectCompliance || {}
  console.log("[DEBUG] compliance object:", compliance);

  const toReserveItems = [
    {
      key: "signedContract",
      name: "Signed Contract",
      status: compliance.signedContract?.fileUrl ? "completed" : "upload",
      file: compliance.signedContract?.fileName,
      fileUrl: compliance.signedContract?.fileUrl,
    },
    {
      key: "irrevocablePo",
      name: "Irrevocable PO",
      status: compliance.irrevocablePo?.fileUrl ? "completed" : "upload",
      file: compliance.irrevocablePo?.fileName,
      fileUrl: compliance.irrevocablePo?.fileUrl,
    },
    {
      key: "paymentAsDeposit",
      name: "Payment as Deposit",
      status: compliance.paymentAsDeposit?.fileUrl ? "completed" : "confirmation",
      note: "For Treasury's confirmation",
      file: compliance.paymentAsDeposit?.fileName,
      fileUrl: compliance.paymentAsDeposit?.fileUrl,
    },
  ]

  const otherRequirementsItems = [
    {
      key: "finalArtwork",
      name: "Final Artwork",
      status: compliance.finalArtwork?.fileUrl ? "completed" : "upload",
      file: compliance.finalArtwork?.fileName,
      fileUrl: compliance.finalArtwork?.fileUrl,
    },
    {
      key: "signedQuotation",
      name: "Signed Quotation",
      status: compliance.signedQuotation?.fileUrl ? "completed" : "upload",
      file: compliance.signedQuotation?.fileName,
      fileUrl: compliance.signedQuotation?.fileUrl,
    },
  ]

  const allItems = [...toReserveItems, ...otherRequirementsItems]
  const completed = allItems.filter((item) => item.status === "completed").length
  return {
    completed,
    total: allItems.length,
    toReserve: toReserveItems,
    otherRequirements: otherRequirementsItems,
  }
}
