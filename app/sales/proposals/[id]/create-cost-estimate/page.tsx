"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Plus, Trash2, Send, Save } from "lucide-react"
import { getProposalById, updateProposalStatus } from "@/lib/proposal-service"
import { createCostEstimateFromProposal } from "@/lib/cost-estimate-service"
import type { Proposal } from "@/lib/types/proposal"
import type { CostEstimateLineItem } from "@/lib/types/cost-estimate"
import { useToast } from "@/hooks/use-toast"

export default function CreateCostEstimatePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lineItems, setLineItems] = useState<CostEstimateLineItem[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchProposal() {
      if (params.id) {
        try {
          const proposalData = await getProposalById(params.id as string)
          setProposal(proposalData)

          if (proposalData) {
            // Clear any existing line items first
            setLineItems([])

            // Generate initial line items from proposal
            const initialItems: CostEstimateLineItem[] = proposalData.products.map((product, index) => ({
              id: `item_${index + 1}`,
              description: `${product.name} - ${product.location}`,
              quantity: 1,
              unitPrice: product.price,
              totalPrice: product.price,
              category: "media_cost" as const,
            }))

            // Add standard categories
            initialItems.push(
              {
                id: `item_${initialItems.length + 1}`,
                description: "Creative Design & Production",
                quantity: 1,
                unitPrice: 0,
                totalPrice: 0,
                category: "production_cost" as const,
              },
              {
                id: `item_${initialItems.length + 2}`,
                description: "Installation & Setup",
                quantity: 1,
                unitPrice: 0,
                totalPrice: 0,
                category: "installation_cost" as const,
              },
            )

            setLineItems(initialItems)
          }
        } catch (error) {
          console.error("Error fetching proposal:", error)
          toast({
            title: "Error",
            description: "Failed to load proposal details",
            variant: "destructive",
          })
        } finally {
          setLoading(false)
        }
      }
    }

    fetchProposal()
  }, [params.id, toast])

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

  const addLineItem = () => {
    const newItem: CostEstimateLineItem = {
      id: `item_${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      category: "other" as const,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    setLineItems((items) => items.filter((item) => item.id !== id))
  }

  const handleSave = async (sendToClient = false) => {
    if (!proposal) return

    setSaving(true)
    try {
      await createCostEstimateFromProposal(proposal, "current_user", {
        notes,
        customLineItems: lineItems,
        sendEmail: sendToClient,
      })

      // Update proposal status
      const newStatus = sendToClient ? "cost_estimate_pending" : "cost_estimate_pending"
      await updateProposalStatus(proposal.id, newStatus)

      toast({
        title: "Success",
        description: sendToClient ? "Cost estimate created and sent to client" : "Cost estimate saved as draft",
      })

      router.push(`/sales/proposals/${params.id}`)
    } catch (error) {
      console.error("Error creating cost estimate:", error)
      toast({
        title: "Error",
        description: "Failed to create cost estimate",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxRate = 0.12
  const taxAmount = subtotal * taxRate
  const totalAmount = subtotal + taxAmount

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Proposal Not Found</h1>
          <Button onClick={() => router.push("/sales/proposals")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Proposals
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" onClick={() => router.push(`/sales/proposals/${params.id}`)} className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Proposal
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Create Cost Estimate</h1>
              <p className="text-gray-600">For proposal: {proposal.title}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-2" />
                Send to Client
              </Button>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Cost Breakdown</h2>
            <Button onClick={addLineItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {lineItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-200 rounded-lg">
                <div className="col-span-5">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => updateLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={(e) => updateLineItem(item.id, "unitPrice", Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <div className="text-right font-medium">₱{item.totalPrice.toLocaleString()}</div>
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <div className="flex justify-end space-y-2">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (12%):</span>
                  <span>₱{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span>₱{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <Textarea
            placeholder="Add any additional notes or comments..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>
      </div>
    </div>
  )
}
