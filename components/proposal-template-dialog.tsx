"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Calendar, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { ProposalTemplate } from "@/lib/types/proposal-template"

interface ProposalTemplateDialogProps {
  children: React.ReactNode
  onSelectTemplate: (template: ProposalTemplate) => void
  userId?: string
}

export function ProposalTemplateDialog({ children, onSelectTemplate, userId }: ProposalTemplateDialogProps) {
  const [open, setOpen] = useState(false)
  const [templates, setTemplates] = useState<ProposalTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/proposal-templates${userId ? `?userId=${userId}` : ""}`)
      const result = await response.json()

      if (result.success) {
        setTemplates(result.data)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
      toast({
        title: "Error",
        description: "Failed to load proposal templates",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchTemplates()
    }
  }, [open, userId])

  const handleSelectTemplate = (template: ProposalTemplate) => {
    onSelectTemplate(template)
    setOpen(false)
    toast({
      title: "Template Selected",
      description: `Template "${template.name}" has been applied`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Proposal Template</DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a new proposal with pre-filled content.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading templates...</span>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Templates Found</h3>
            <p className="text-gray-600">Create your first proposal template to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">{template.description || "No description"}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {template.products.length} items
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span className="font-medium">${template.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Created {template.createdAt.toLocaleDateString()}</span>
                    </div>
                    {template.client.company && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Client:</span> {template.client.company}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
