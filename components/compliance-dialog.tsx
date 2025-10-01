"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Upload, CheckCircle } from "lucide-react"

interface ComplianceItem {
  key: string
  name: string
  status: "completed" | "upload" | "confirmation"
  file?: string
  fileUrl?: string
  note?: string
}

interface ComplianceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: any
  onFileUpload: (quotationId: string, complianceType: string, file: File) => void
  uploadingFiles: Set<string>
}

export function ComplianceDialog({
  open,
  onOpenChange,
  quotation,
  onFileUpload,
  uploadingFiles
}: ComplianceDialogProps) {
  const compliance = quotation?.projectCompliance || {}

  const toReserveItems: ComplianceItem[] = [
    {
      key: "signedContract",
      name: "Signed Contract",
      status: compliance.signedContract?.fileUrl ? "completed" : "upload",
      file: compliance.signedContract?.fileName,
      fileUrl: compliance.signedContract?.fileUrl,
    },
    {
      key: "paymentAsDeposit",
      name: "Payment as Deposit",
      status: compliance.paymentAsDeposit?.fileUrl ? "completed" : "confirmation",
      file: compliance.paymentAsDeposit?.fileName,
      fileUrl: compliance.paymentAsDeposit?.fileUrl,
    },
    {
      key: "irrevocablePo",
      name: "Irrevocable PO/MO",
      status: compliance.irrevocablePo?.fileUrl ? "completed" : "upload",
      file: compliance.irrevocablePo?.fileName,
      fileUrl: compliance.irrevocablePo?.fileUrl,
    },
  ]

  const allItems = toReserveItems
  const completed = allItems.filter((item) => item.status === "completed").length
  const total = allItems.length

  const handleFileUpload = (complianceType: string) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".pdf"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file && quotation?.id) {
        onFileUpload(quotation.id, complianceType, file)
      }
    }
    input.click()
  }

  const getStatusIcon = (status: string) => {
    if (status === "completed") {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 bg-white rounded-[20px]">
        <DialogHeader className="flex flex-row items-center justify-between p-4 pb-3">
          <DialogTitle className="text-[20px] font-bold text-[#333333]">
            Compliance <span className="font-light">({completed}/{total})</span>
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 text-[#333333] hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="px-4 pb-3">
          <p className="text-[12px] text-[#a1a1a1] italic">
            *Upload/approve at least (1) document to "Reserve"
          </p>
        </div>

        <div className="px-4">
          {/* Header */}
          <div className="grid grid-cols-[120px_140px_80px] gap-2 mb-2">
            <div className="text-[12px] font-bold text-[#333333]">Document</div>
            <div className="text-[12px] font-bold text-[#333333] text-center">File</div>
            <div className="text-[12px] font-bold text-[#333333] text-center">Action</div>
          </div>

          {/* Separator line */}
          <div className="h-px bg-gray-300 mb-3" />

          {/* Compliance Items */}
          <div className="mb-4">
            {toReserveItems.map((item, index) => (
              <div key={item.key} className="mb-2">
                <div className="grid grid-cols-[120px_140px_80px] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#333333]">{item.name}</span>
                  </div>
                  <div className="text-center">
                    {item.file ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[12px] text-[#2d3fff] underline cursor-pointer"
                      >
                        {item.file}
                      </a>
                    ) : (
                      <span className="text-[12px] text-[#333333]">-</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={() => handleFileUpload(item.key)}
                      disabled={uploadingFiles.has(`${quotation?.id}-${item.key}`)}
                      className="bg-white border-2 border-[#c4c4c4] text-[#333333] hover:bg-gray-50 rounded-[6px] h-[24px] px-2 text-[10px]"
                      variant="outline"
                    >
                      {uploadingFiles.has(`${quotation?.id}-${item.key}`) ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                {item.note && (
                  <p className="text-[10px] text-[#a1a1a1] mt-1 ml-6">{item.note}</p>
                )}
                {/* Separator line */}
                {index < toReserveItems.length - 1 && <div className="h-px bg-gray-300 mt-2" />}
              </div>
            ))}
          </div>
        </div>

        {/* Mark as Reserved Button */}
        <div className="flex justify-end pb-4 pr-4">
          <Button
            className="bg-[#48b02c] hover:bg-[#3d8f24] text-white font-bold text-[12px] rounded-[6px] h-[28px] px-4"
          >
            Mark as Reserved
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}