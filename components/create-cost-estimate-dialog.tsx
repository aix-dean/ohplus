"use client"

import { cn } from "@/lib/utils"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Mail, Loader2 } from "lucide-react"
import { createCostEstimateFromProposal } from "@/lib/cost-estimate-service"
import type { Proposal } from "@/lib/types/proposal"
import type { CostEstimateLineItem } from "@/lib/types/cost-estimate"
import { useRouter } from "next/navigation"
import { CostEstimateSentSuccessDialog } from "./cost-estimate-sent-success-dialog"

interface CreateCostEstimateDialogProps {
  isOpen: boolean
  onClose: () => void
  proposal: Proposal
  onCostEstimateCreated: () => void
}

const categoryLabels = {
  media_cost: "Media Cost",
  production_cost: "Production Cost",
  installation_cost: "Installation Cost",
  maintenance_cost: "Maintenance Cost",
  other: "Other",
}

export function CreateCostEstimateDialog({
  isOpen,
  onClose,
  proposal,
  onCostEstimateCreated,
}: CreateCostEstimateDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const [lineItems, setLineItems] = useState<CostEstimateLineItem[]>([])
  const [notes, setNotes] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [creationStep, setCreationStep] = useState("")
  const [step, setStep] = useState<"edit" | "success">("edit")
  const [subject, setSubject] = useState("") // New
  const [body, setBody] = useState("") // New
  const [ccEmail, setCcEmail] = useState("") // New
  const [currentUserEmail, setCurrentUserEmail] = useState("") // New
  const [showSuccessDialog, setShowSuccessDialog] = useState(false) // New

  // Initialize with default line items based on proposal
  useEffect(() => {
    if (proposal) {
      // Generate default line items based on proposal products only
      const defaultItems: CostEstimateLineItem[] = proposal.products.map((product, index) => ({
        id: `item_${index + 1}`,
        description: `${product.name} - ${product.location}`,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
        category: "media_cost" as const,
      }))

      const additionalItems: CostEstimateLineItem[] = [
        {
          id: `item_${defaultItems.length + 1}`,
          description: "Creative Design & Production",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: "production_cost" as const,
        },
        {
          id: `item_${defaultItems.length + 2}`,
          description: "Installation & Setup",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: "installation_cost" as const,
        },
        {
          id: `item_${defaultItems.length + 3}`,
          description: "Maintenance & Monitoring",
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0,
          category: "maintenance_cost" as const,
        },
      ]

      setLineItems([...defaultItems, ...additionalItems])
    }
    // New: Initialize email fields
    if (isOpen) {
      setSubject(`Cost Estimate for ${proposal.title}`)
      setBody(
        `Dear ${proposal.client.contactPerson || proposal.client.company},\n\nPlease find the detailed cost estimate for your advertising campaign. You can view it online by clicking the button below.\n\nBest regards,\nThe OH Plus Team`,
      )
      if (user?.email) {
        setCurrentUserEmail(user.email)
      } else {
        setCurrentUserEmail("")
      }
    }
  }, [proposal, isOpen, user]) // Add isOpen and user to dependencies

  const addLineItem = () => {
    const newItem: CostEstimateLineItem = {
      id: `item_${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: "other",
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (id: string, field: keyof CostEstimateLineItem, value: any) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === "quantity" || field === "unitPrice") {
            updated.totalPrice = updated.quantity * updated.unitPrice
          }
          return updated
        }
        return item
      }),
    )
  }

  const removeLineItem = (id: string) => {
    setLineItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxRate = 0.12 // 12% VAT
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + taxAmount

  const handleCreateCostEstimate = async () => {
    if (!user?.uid) return

    // Validation
    if (lineItems.length === 0) {
      toast({
        title: "No line items",
        description: "Please add at least one line item.",
        variant: "destructive",
      })
      return
    }

    const hasEmptyDescriptions = lineItems.some((item) => !item.description.trim())
    if (hasEmptyDescriptions) {
      toast({
        title: "Missing descriptions",
        description: "Please fill in all line item descriptions.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      setCreationStep("Preparing cost estimate...")
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (sendEmail) {
        setCreationStep("Generating access code...")
        await new Promise((resolve) => setTimeout(resolve, 400))

        setCreationStep("Preparing email content...")
        await new Promise((resolve) => setTimeout(resolve, 500))

        setCreationStep("Sending email to client...")
        await new Promise((resolve) => setTimeout(resolve, 300))
      }

      // Call the service to create the cost estimate
      const costEstimateId = await createCostEstimateFromProposal(proposal, user.uid, {
        notes: notes.trim(),
        customLineItems: lineItems,
        sendEmail,
      })

      // If email is to be sent, call the API route
      if (sendEmail) {
        const response = await fetch("/api/cost-estimates/send-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            costEstimate: { id: costEstimateId, title: subject, lineItems, totalAmount, createdAt: new Date() }, // Pass minimal data needed for email template
            clientEmail: proposal.client.email,
            client: proposal.client,
            subject, // New
            body, // New
            currentUserEmail, // New
            ccEmail, // New
          }),
        })

        const result = await response.json()
        if (!response.ok || !result.success) {
          throw new Error(result.error || result.details || "Failed to send email")
        }
      }

      setCreationStep("Finalizing...")
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Instead of setting step to "success" directly, open the new success dialog
      onClose() // Close the create dialog immediately
      setShowSuccessDialog(true) // Show the new success dialog
    } catch (error) {
      console.error("Error creating cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to create cost estimate. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
      setCreationStep("")
    }
  }

  const resetForm = () => {
    setLineItems([])
    setNotes("")
    setSendEmail(true)
    setStep("edit") // Keep this for internal dialog state
    setCreationStep("")
    setSubject("") // New
    setBody("") // New
    setCcEmail("") // New
    setCurrentUserEmail("") // New
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // New: Callback function to handle navigation after success dialog dismisses
  const handleSuccessDialogDismissAndNavigate = () => {
    setShowSuccessDialog(false) // Hide the success dialog
    onCostEstimateCreated() // Trigger parent callback
    // router.push("/sales/dashboard") // Example navigation, adjust as needed
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className={cn("max-w-5xl", "max-h-[90vh] overflow-y-auto")}>
          <DialogHeader>
            <DialogTitle>Create Cost Estimate</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Proposal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Proposal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Proposal Title</Label>
                    <p className="font-medium">{proposal.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Client</Label>
                    <p className="font-medium">{proposal.client.company}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contact</Label>
                    <p className="font-medium">{proposal.client.contactPerson}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Cost Breakdown
                  <Button onClick={addLineItem} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-4 border rounded-lg">
                      <div className="col-span-4">
                        <Label className="text-sm">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm">Category</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) => updateLineItem(item.id, "category", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(categoryLabels).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-1">
                        <Label className="text-sm">Qty</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(item.id, "quantity", Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm">Unit Price</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(item.id, "unitPrice", Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm">Total</Label>
                        <div className="h-10 flex items-center font-medium">₱{item.totalPrice.toLocaleString()}</div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          onClick={() => removeLineItem(item.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₱{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (12%):</span>
                    <span>₱{taxAmount.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span className="text-green-700">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes or terms"
                rows={3}
              />
            </div>

            {/* Email Fields - New Section */}
            {sendEmail && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Email Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="to" className="text-right">
                      To
                    </Label>
                    <Input id="to" value={proposal.client.email} readOnly className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="cc" className="text-right">
                      CC
                    </Label>
                    <Input
                      id="cc"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      placeholder="Optional: comma-separated emails"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="from" className="text-right">
                      From
                    </Label>
                    <Input id="from" value="OH Plus <noreply@resend.dev>" readOnly className="col-span-3" />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="replyTo" className="text-right">
                      Reply-To
                    </Label>
                    <Input
                      id="replyTo"
                      value={currentUserEmail}
                      onChange={(e) => setCurrentUserEmail(e.target.value)}
                      placeholder="Your email"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="col-span-3"
                      placeholder="e.g., Cost Estimate for Your Campaign"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="body" className="text-right pt-2">
                      Body
                    </Label>
                    <Textarea
                      id="body"
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="col-span-3 min-h-[150px]"
                      placeholder="e.g., Dear [Client Name],\n\nPlease find our cost estimate attached...\n\nBest regards,\nThe OH Plus Team"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Email Option (Checkbox) */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendEmail"
                    checked={sendEmail}
                    onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                  />
                  <Label htmlFor="sendEmail" className="flex items-center space-x-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    <span>Send cost estimate to client via email automatically</span>
                  </Label>
                </div>
                {sendEmail && (
                  <p className="text-sm text-gray-600 mt-2 ml-6">
                    The cost estimate will be sent to {proposal.client.email} immediately after creation with a secure
                    access code.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateCostEstimate} disabled={isCreating} className="min-w-[160px]">
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs">{sendEmail ? "Creating & Sending..." : "Creating..."}</span>
                      {creationStep && <span className="text-xs opacity-80">{creationStep}</span>}
                    </div>
                  </>
                ) : sendEmail ? (
                  "Create & Send"
                ) : (
                  "Create Cost Estimate"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cost Estimate Sent Success Dialog */}
      <CostEstimateSentSuccessDialog
        isOpen={showSuccessDialog}
        onDismissAndNavigate={handleSuccessDialogDismissAndNavigate}
      />
    </>
  )
}
