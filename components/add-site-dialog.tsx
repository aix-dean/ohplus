"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getCostEstimate } from "@/lib/cost-estimate-service"
import { Loader2, Search } from "lucide-react"

interface AddSiteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAddSite: (costEstimateId: string) => void
}

export function AddSiteDialog({ isOpen, onOpenChange, onAddSite }: AddSiteDialogProps) {
  const [costEstimateId, setCostEstimateId] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleAddSite = async () => {
    if (!costEstimateId.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a cost estimate ID.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Verify the cost estimate exists
      const costEstimate = await getCostEstimate(costEstimateId.trim())
      if (!costEstimate) {
        toast({
          title: "Cost Estimate Not Found",
          description: "The cost estimate ID you entered doesn't exist.",
          variant: "destructive",
        })
        return
      }

      onAddSite(costEstimateId.trim())
      setCostEstimateId("")
      onOpenChange(false)

      toast({
        title: "Site Added",
        description: `Added cost estimate for ${costEstimate.client?.company || "Unknown Client"}.`,
      })
    } catch (error) {
      console.error("Error adding site:", error)
      toast({
        title: "Error",
        description: "Failed to add site. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Site</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="costEstimateId">Cost Estimate ID</Label>
            <Input
              id="costEstimateId"
              placeholder="Enter cost estimate ID..."
              value={costEstimateId}
              onChange={(e) => setCostEstimateId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddSite()
                }
              }}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddSite} disabled={loading || !costEstimateId.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Add Site
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
