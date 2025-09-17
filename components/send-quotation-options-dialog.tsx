"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Copy } from "lucide-react"
import type { Quotation } from "@/lib/types/quotation"
import Image from "next/image"

interface SendQuotationOptionsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation
  onEmailClick: () => void
  companyData?: {
    photo_url?: string
    name?: string
  }
}

export function SendQuotationOptionsDialog({
  isOpen,
  onOpenChange,
  quotation,
  onEmailClick,
  companyData,
}: SendQuotationOptionsDialogProps) {
  const { toast } = useToast()

  const publicViewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicViewUrl)
    toast({
      title: "Link Copied!",
      description: "The public view link has been copied to your clipboard.",
    })
  }

  const handleNotImplemented = (platform: string) => {
    toast({
      title: "Feature Not Implemented",
      description: `Sending via ${platform} is not yet available.`,
      variant: "destructive",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Send Quotation</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
              {companyData?.photo_url ? (
                <Image
                  src={companyData.photo_url || "/placeholder.svg"}
                  alt="Company Logo"
                  width={80}
                  height={80}
                  objectFit="contain"
                />
              ) : (
                <Image
                  src="/placeholder.svg?height=80&width=80"
                  alt="Placeholder"
                  width={80}
                  height={80}
                  objectFit="contain"
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500">{quotation.quotation_number}</p>
              <h3 className="text-lg font-semibold text-gray-900 break-words">
                {quotation.client_name || quotation.client_company_name || quotation.items?.name || "Untitled Quotation"}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Input value={publicViewUrl} readOnly className="flex-1 min-w-0 text-blue-600 break-all" />
            <Button variant="outline" className="bg-black text-white" onClick={handleCopyLink}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4 grid grid-cols-4 gap-4 text-center">
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-auto p-2"
              onClick={onEmailClick}
            >
              <Image
                src="/icons/email.png"
                alt="Email"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xs mt-1">Email</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-auto p-2"
              onClick={() => handleNotImplemented("WhatsApp")}
            >
              <Image
                src="/icons/whatsapp.png"
                alt="WhatsApp"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xs mt-1">Whatsapp</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-auto p-2"
              onClick={() => handleNotImplemented("Viber")}
            >
              <Image
                src="/icons/viber.png"
                alt="Viber"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xs mt-1">Viber</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-auto p-2"
              onClick={() => handleNotImplemented("Messenger")}
            >
              <Image
                src="/icons/messenger.png"
                alt="Messenger"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-xs mt-1">Messenger</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
