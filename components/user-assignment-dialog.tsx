"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { Users, UserPlus, UserMinus, Calendar, Package, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface User {
  id: string
  uid: string
  first_name: string
  last_name: string
  email: string
}

interface Assignment {
  userId: string
  assignedDate: string
  returnedDate?: string
  status: "assigned" | "returned"
}

interface InventoryItem {
  id: string
  name: string
  stock: number
  assignments?: Assignment[]
}

interface UserAssignmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  users: User[]
  onUpdate: () => void
}

export function UserAssignmentDialog({ open, onOpenChange, item, users, onUpdate }: UserAssignmentDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isReturning, setIsReturning] = useState(false)

  const assignments = item?.assignments || []
  const activeAssignments = assignments.filter((a) => a.status === "assigned")
  const availableStock = item ? item.stock : 0
  const canAssignMore = availableStock > 0

  const getUserDisplayName = (userId: string) => {
    const user = users.find((u) => u.uid === userId)
    if (!user) return "Unknown User"
    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  const handleAssignUser = async () => {
    if (!item || !selectedUserId || isAssigning) return

    // Check if user is already assigned
    const existingAssignment = activeAssignments.find((a) => a.userId === selectedUserId)
    if (existingAssignment) {
      toast({
        title: "User Already Assigned",
        description: "This user already has this item assigned.",
        variant: "destructive",
      })
      return
    }

    if (availableStock <= 0) {
      toast({
        title: "No Stock Available",
        description: "Cannot assign item - no stock available.",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)

    try {
      const newAssignment: Assignment = {
        userId: selectedUserId,
        assignedDate: new Date().toISOString(),
        status: "assigned",
      }

      const updatedAssignments = [...assignments, newAssignment]
      const newStock = Math.max(0, item.stock - 1)

      const itemRef = doc(db, "itInventory", item.id)
      await updateDoc(itemRef, {
        assignments: updatedAssignments,
        stock: newStock,
        updated_at: serverTimestamp(),
      })

      const userName = getUserDisplayName(selectedUserId)
      toast({
        title: "User Assigned",
        description: `${item.name} has been assigned to ${userName}`,
      })

      setSelectedUserId("")
      onUpdate()
    } catch (error) {
      console.error("Error assigning user:", error)
      toast({
        title: "Error",
        description: "Failed to assign user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleReturnItem = async (assignmentIndex: number) => {
    if (!item || isReturning) return

    setIsReturning(true)

    try {
      const updatedAssignments = [...assignments]
      updatedAssignments[assignmentIndex] = {
        ...updatedAssignments[assignmentIndex],
        returnedDate: new Date().toISOString(),
        status: "returned",
      }

      const newStock = item.stock + 1

      const itemRef = doc(db, "itInventory", item.id)
      await updateDoc(itemRef, {
        assignments: updatedAssignments,
        stock: newStock,
        updated_at: serverTimestamp(),
      })

      const userName = getUserDisplayName(assignments[assignmentIndex].userId)
      toast({
        title: "Item Returned",
        description: `${item.name} has been returned by ${userName}`,
      })

      onUpdate()
    } catch (error) {
      console.error("Error returning item:", error)
      toast({
        title: "Error",
        description: "Failed to process return. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReturning(false)
    }
  }

  const availableUsers = users.filter((user) => !activeAssignments.some((assignment) => assignment.userId === user.uid))

  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Manage User Assignments</span>
          </DialogTitle>
          <DialogDescription>Assign {item.name} to users. Each assignment will deduct 1 from stock.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stock Information */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Available Stock</span>
                </div>
                <Badge variant={availableStock > 0 ? "default" : "destructive"}>{availableStock} units</Badge>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Currently Assigned</span>
                <span className="text-sm font-medium">{activeAssignments.length} users</span>
              </div>
            </CardContent>
          </Card>

          {/* Assign New User */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Assign to New User</span>
            </h4>

            <div className="flex space-x-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={!canAssignMore}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={canAssignMore ? "Select a user to assign..." : "No stock available"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.uid} value={user.uid}>
                      {getUserDisplayName(user.uid)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssignUser} disabled={!selectedUserId || !canAssignMore || isAssigning} size="sm">
                {isAssigning ? "Assigning..." : "Assign"}
              </Button>
            </div>

            {!canAssignMore && (
              <div className="flex items-center space-x-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>No stock available for new assignments</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Current Assignments */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Current Assignments ({activeAssignments.length})</span>
            </h4>

            {activeAssignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No active assignments</p>
              </div>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {assignments.map((assignment, index) => {
                    if (assignment.status !== "assigned") return null

                    return (
                      <Card key={index}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{getUserDisplayName(assignment.userId)}</span>
                                <Badge variant="outline" className="text-xs">
                                  Active
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Assigned: {new Date(assignment.assignedDate).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReturnItem(index)}
                              disabled={isReturning}
                              className="text-green-600 hover:text-green-700"
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Return
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Assignment History */}
          {assignments.some((a) => a.status === "returned") && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-sm font-medium flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Assignment History</span>
                </h4>

                <ScrollArea className="max-h-32">
                  <div className="space-y-2">
                    {assignments.map((assignment, index) => {
                      if (assignment.status !== "returned") return null

                      return (
                        <Card key={index} className="bg-muted/50">
                          <CardContent className="p-3">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{getUserDisplayName(assignment.userId)}</span>
                                <Badge variant="secondary" className="text-xs">
                                  Returned
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(assignment.assignedDate).toLocaleDateString()}</span>
                                </div>
                                {assignment.returnedDate && (
                                  <div className="flex items-center space-x-1">
                                    <span>→</span>
                                    <span>{new Date(assignment.returnedDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
