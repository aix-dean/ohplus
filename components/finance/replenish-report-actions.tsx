"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FileText, MoreVertical, Printer, Send } from "lucide-react"
import type { FinanceRequest } from "@/lib/types/finance-request"
import { generateReplenishRequestPDF } from "@/lib/replenish-pdf"

type Props = { request: FinanceRequest }

function dataUrlToBlob(dataUrl: string): Blob {
  const [prefix, data] = dataUrl.split(",")
  const mime = prefix.substring(prefix.indexOf(":") + 1, prefix.indexOf(";"))
  const binStr = atob(data)
  const len = binStr.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) bytes[i] = binStr.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export default function ReplenishReportActions({ request }: Props) {
  const { toast } = useToast()
  const [openSend, setOpenSend] = useState(false)
  const [sending, setSending] = useState(false)

  const defaultSubject = useMemo(() => `Replenishment Request Report - #${request["Request No."]}`, [request])
  const [to, setTo] = useState("")
  const [cc, setCc] = useState("")
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(
    `Hello,\n\nPlease find attached the replenishment request report for Request #${request["Request No."]}.\n\nThank you.`,
  )

  const handlePrint = async () => {
    try {
      const dataUrl = await generateReplenishRequestPDF(request as any, { returnDataUrl: true })
      if (!dataUrl || typeof dataUrl !== "string") throw new Error("Failed to generate PDF")
      const blob = dataUrlToBlob(dataUrl)
      const url = URL.createObjectURL(blob)
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      console.error(e)
      toast({ title: "Error", description: "Unable to generate report for printing.", variant: "destructive" })
    }
  }

  const handleSend = async () => {
    const toList = to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const ccList = cc
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    if (toList.length === 0) {
      toast({
        title: "Recipient required",
        description: "Add at least one email in the To field.",
        variant: "destructive",
      })
      return
    }

    try {
      setSending(true)
      const dataUrl = await generateReplenishRequestPDF(request as any, { returnDataUrl: true })
      if (!dataUrl || typeof dataUrl !== "string") throw new Error("Failed to generate PDF")
      const base64 = dataUrl.split(",")[1] // strip data URL prefix
      const fileName = `replenish-request-${String(request["Request No."] ?? request.id)}.pdf`

      const res = await fetch("/api/reports/replenish/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toList,
          cc: ccList,
          subject,
          html: message.replace(/\n/g, "<br/>"),
          pdfBase64: base64,
          fileName,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || "Email send failed")
      }

      toast({ title: "Report sent", description: "The PDF report was emailed successfully." })
      setOpenSend(false)
    } catch (e: any) {
      console.error(e)
      toast({ title: "Failed to send", description: e?.message || "An error occurred.", variant: "destructive" })
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Replenish report actions">
            <MoreVertical className="h-4 w-4 mr-2" />
            Report
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Replenish
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpenSend(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={openSend} onOpenChange={setOpenSend}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Replenishment Report</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label htmlFor="to" className="text-sm text-muted-foreground">
                To (comma separated)
              </label>
              <Input
                id="to"
                placeholder="name@example.com, other@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="grid gap-1">
              <label htmlFor="cc" className="text-sm text-muted-foreground">
                CC (optional, comma separated)
              </label>
              <Input id="cc" placeholder="cc1@example.com" value={cc} onChange={(e) => setCc(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label htmlFor="subject" className="text-sm text-muted-foreground">
                Subject
              </label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <label htmlFor="message" className="text-sm text-muted-foreground">
                Message
              </label>
              <Textarea id="message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSend(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Sending..." : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
