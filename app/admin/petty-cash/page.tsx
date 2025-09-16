"use client"

import { useState, useEffect } from "react"

interface ExpenseCycle {
  id: string
  from: string
  until: string
  amount: number
  expenses: {
    item: string
    amount: number
    date: string
    requestedBy: string
  }[]
}
import { Search, ChevronDown, ChevronUp, MoreVertical, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddExpenseDialog } from "@/components/add-expense-dialog"
import { ConfigurationDialog } from "@/components/configuration-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { savePettyCashConfig, getPettyCashConfig, createPettyCashCycle, getNextCycleNo, getActivePettyCashCycle, completePettyCashCycle, getPettyCashCycles, getPettyCashExpenses, savePettyCashExpense, getLatestPettyCashCycle, updatePettyCashCycleTotal, uploadFileToFirebase } from "@/lib/petty-cash-service"
import { useToast } from "@/hooks/use-toast"

export default function PettyCashPage() {
  const { userData } = useAuth()
  const { toast } = useToast()
  const [expandedCycles, setExpandedCycles] = useState<string[]>(["0012"])
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [isConfigLoading, setIsConfigLoading] = useState(false)
  const [configData, setConfigData] = useState({ pettyCashAmount: 10000, warnAmount: 2000 })
  const [onHandAmount, setOnHandAmount] = useState(10000000) // Default fallback
  const [expenseCycles, setExpenseCycles] = useState<ExpenseCycle[]>([])
  const [isExpensesLoading, setIsExpensesLoading] = useState(false)

  // Debug: Log onHandAmount changes
  useEffect(() => {
    console.log("onHandAmount state changed to:", onHandAmount)
  }, [onHandAmount])

  // Load existing configuration on component mount
  useEffect(() => {
    const loadConfiguration = async () => {
      console.log("Loading configuration - userData:", userData)
      console.log("Company ID:", userData?.company_id)

      if (!userData?.company_id) {
        console.log("No company_id found, skipping configuration load")
        return
      }

      try {
        console.log("Fetching configuration for company:", userData.company_id)
        const existingConfig = await getPettyCashConfig(userData.company_id)
        console.log("Configuration fetched:", existingConfig)

        if (existingConfig) {
          console.log("Setting configuration data:", existingConfig.amount, existingConfig.warning_amount)
          setConfigData({
            pettyCashAmount: existingConfig.amount,
            warnAmount: existingConfig.warning_amount,
          })
          // Set on-hand amount to the configured petty cash amount
          setOnHandAmount(existingConfig.amount)
          console.log("On-hand amount set to:", existingConfig.amount)
        } else {
          console.log("No configuration found in database")
        }
      } catch (error) {
        console.error("Error loading petty cash configuration:", error)
        // Keep default values if loading fails
      }
    }

    loadConfiguration()
  }, [userData?.company_id])


  const toggleCycle = (cycleId: string) => {
    setExpandedCycles((prev) => (prev.includes(cycleId) ? prev.filter((id) => id !== cycleId) : [...prev, cycleId]))
  }

  const handleAddExpense = async (data: { item: string; amount: number; requestedBy: string; attachments: File[] }) => {
    console.log("handleAddExpense called with data:", data)
    if (!userData?.company_id || !userData?.uid) {
      console.log("Missing user data:", { company_id: userData?.company_id, uid: userData?.uid })
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("Getting latest cycle for company:", userData.company_id)
      // Get latest cycle
      const latestCycle = await getLatestPettyCashCycle(userData.company_id)
      console.log("Latest cycle:", latestCycle)
      if (!latestCycle) {
        toast({
          title: "Error",
          description: "No petty cash cycle found. Please create a cycle first.",
          variant: "destructive",
        })
        return
      }

      // Upload attachments
      console.log("Uploading attachments:", data.attachments.length, "files")
      const attachmentUrls: string[] = []
      for (const file of data.attachments) {
        try {
          console.log("Uploading file:", file.name)
          const url = await uploadFileToFirebase(file, `petty-cash/${userData.company_id}/${latestCycle.id}`)
          console.log("Uploaded URL:", url)
          attachmentUrls.push(url)
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError)
          toast({
            title: "Upload Error",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          })
          return
        }
      }
      console.log("All attachments uploaded:", attachmentUrls)

      // Save expense
      console.log("Saving expense with data:", {
        companyId: userData.company_id,
        userId: userData.uid,
        cycleId: latestCycle.id,
        expenseData: {
          item: data.item,
          amount: data.amount,
          requestedBy: data.requestedBy,
          attachment: attachmentUrls,
        }
      })
      if (!latestCycle.id) {
        toast({
          title: "Error",
          description: "Invalid cycle ID",
          variant: "destructive",
        })
        return
      }
      await savePettyCashExpense(
        userData.company_id,
        userData.uid,
        latestCycle.id,
        {
          item: data.item,
          amount: data.amount,
          requestedBy: data.requestedBy,
          attachment: attachmentUrls,
        }
      )
      console.log("Expense saved successfully")

      // Update cycle total
      const newTotal = latestCycle.total + data.amount
      console.log("Updating cycle total from", latestCycle.total, "to", newTotal)
      if (!latestCycle.id) {
        toast({
          title: "Error",
          description: "Invalid cycle ID for update",
          variant: "destructive",
        })
        return
      }
      await updatePettyCashCycleTotal(latestCycle.id, newTotal)
      console.log("Cycle total updated")

      // Refresh expenses
      const updatedCycles = await getPettyCashCycles(userData.company_id)
      const transformedCycles: ExpenseCycle[] = await Promise.all(
        updatedCycles.map(async (cycle) => {
          const expenses = await getPettyCashExpenses(cycle.id!)
          const transformedExpenses = expenses.map(exp => ({
            item: exp.item,
            amount: exp.amount,
            date: formatDate(exp.created),
            requestedBy: exp.requested_by
          }))

          return {
            id: cycle.cycle_no.toString().padStart(4, '0'),
            from: formatDate(cycle.startDate),
            until: formatDate(cycle.endDate),
            amount: cycle.total,
            expenses: transformedExpenses
          }
        })
      )
      setExpenseCycles(transformedCycles)

      // Update on-hand amount
      setOnHandAmount(onHandAmount - data.amount)

      toast({
        title: "Success",
        description: "Expense added successfully",
      })

    } catch (error) {
      console.error("Error adding expense:", error)
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      })
    } finally {
      setIsAddExpenseOpen(false)
    }
  }

  const handleSaveConfiguration = async (data: { pettyCashAmount: number; warnAmount: number }) => {
    console.log("handleSaveConfiguration called with data:", data)

    if (!userData?.company_id || !userData?.uid) {
      console.log("Missing user data:", { company_id: userData?.company_id, uid: userData?.uid })
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      })
      return
    }

    setIsConfigLoading(true)

    try {
      console.log("Saving configuration to database...")
      // Save to database
      const configId = await savePettyCashConfig(
        userData.company_id,
        userData.uid,
        data.pettyCashAmount,
        data.warnAmount
      )
      console.log("Configuration saved with ID:", configId)

      // Update local state
      setConfigData(data)
      console.log("Config data updated:", data)

      // Update on-hand amount to match the new petty cash amount
      setOnHandAmount(data.pettyCashAmount)
      console.log("On-hand amount updated to:", data.pettyCashAmount)

      // Close dialog
      setIsConfigOpen(false)

      // Show success message
      toast({
        title: "Configuration Saved",
        description: "Petty cash configuration has been updated successfully",
      })

    } catch (error) {
      console.error("Error saving petty cash configuration:", error)
      toast({
        title: "Error",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfigLoading(false)
    }
  }

  const handleReplenishConfirm = async () => {
    if (!userData?.company_id || !userData?.uid) {
      toast({
        title: "Error",
        description: "User authentication required",
        variant: "destructive",
      })
      return
    }

    try {
      // Get petty cash configuration
      const config = await getPettyCashConfig(userData.company_id)
      if (!config) {
        toast({
          title: "Error",
          description: "Petty cash configuration not found",
          variant: "destructive",
        })
        return
      }

      // Complete active cycle if exists
      const activeCycle = await getActivePettyCashCycle(userData.company_id)
      if (activeCycle) {
        await completePettyCashCycle(activeCycle.id!)
      }

      // Get next cycle number
      const nextCycleNo = await getNextCycleNo(userData.company_id)

      // Create new cycle
      await createPettyCashCycle(
        userData.company_id,
        userData.uid,
        config.id!,
        nextCycleNo,
      )

      // Update on-hand amount
      setOnHandAmount(config.amount)

      toast({
        title: "Success",
        description: "New petty cash cycle created successfully",
      })

    } catch (error) {
      console.error("Error creating new petty cash cycle:", error)
      toast({
        title: "Error",
        description: "Failed to create new petty cash cycle",
        variant: "destructive",
      })
    }
  }

  // Check if on-hand amount is at or below warning threshold
  const isBalanceLow = onHandAmount <= configData.warnAmount

  // Helper function to format Firestore Timestamp to readable date
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "-"
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Load expense cycles on component mount
  useEffect(() => {
    const loadExpenseCycles = async () => {
      console.log("Loading expense cycles - userData:", userData)
      console.log("Company ID:", userData?.company_id)

      if (!userData?.company_id) {
        console.log("No company_id found, skipping cycles load")
        return
      }

      setIsExpensesLoading(true)

      try {
        console.log("Fetching petty cash cycles for company:", userData.company_id)
        const cycles = await getPettyCashCycles(userData.company_id)
        console.log("Fetched cycles:", cycles)

        // Transform cycles and fetch expenses for each
        const transformedCycles: ExpenseCycle[] = await Promise.all(
          cycles.map(async (cycle) => {
            const expenses = await getPettyCashExpenses(cycle.id!)
            const transformedExpenses = expenses.map(exp => ({
              item: exp.item,
              amount: exp.amount,
              date: formatDate(exp.created),
              requestedBy: exp.requested_by
            }))

            return {
              id: cycle.cycle_no.toString().padStart(4, '0'),
              from: formatDate(cycle.startDate),
              until: formatDate(cycle.endDate),
              amount: cycle.total,
              expenses: transformedExpenses
            }
          })
        )

        console.log("Transformed cycles:", transformedCycles)
        setExpenseCycles(transformedCycles)

      } catch (error) {
        console.error("Error loading expense cycles:", error)
        // Keep empty array on error
      } finally {
        setIsExpensesLoading(false)
      }
    }

    loadExpenseCycles()
  }, [userData?.company_id])

  return (
    <div className="h-screen bg-[#fafafa] overflow-hidden">
      <div className="flex h-full">
        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto h-full">
            {/* Header with Configuration Button */}
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-2xl font-semibold text-[#000000]">Petty Cash</h1>
              <Button
                variant="outline"
                className="border-[#c4c4c4] text-[#000000] bg-transparent"
                onClick={() => setIsConfigOpen(true)}
              >
                Configuration
              </Button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 h-full">
              {/* On Hand Section */}
              <div className="bg-white rounded-lg border border-[#e0e0e0] p-6 flex flex-col flex-1 min-h-auto">
                <div className="flex-1 h-20">
                  <h2 className="text-lg font-medium text-[#000000] mb-4">On Hand</h2>
                  <div className={`text-4xl font-bold mb-4 flex items-center justify-center gap-2 ${isBalanceLow ? 'text-red-600' : 'text-[#30c71d]'}`}>
                    {isBalanceLow && <AlertTriangle className="w-8 h-8 text-red-600" />}
                    <span>₱{onHandAmount.toLocaleString()}</span>
                  </div>
                  {isBalanceLow && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md mb-4">
                      ⚠️ Petty cash balance is low! Consider replenishing.
                    </div>
                  )}
                  <div className="text-sm text-[#a1a1a1] space-y-1">
                    <div className="text-center">Cycle#: 0012</div>
                    <div>Start: Nov 10, 2025</div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Button variant="outline" className="w-full border-[#c4c4c4] text-[#000000] bg-transparent">
                    Create Report
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full border-[#c4c4c4] text-[#000000] bg-transparent">
                        Replenish
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-[#000000]">Create New Cycle</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#666666]">
                          Do you want to make a New Cycle? This will archive the current cycle and start fresh with the configured petty cash amount.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-[#c4c4c4] text-[#000000] bg-transparent hover:bg-[#fafafa]">
                          No
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReplenishConfirm}
                          className="bg-[#737fff] hover:bg-[#5a5fff] text-white"
                        >
                          Yes
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    className="w-full bg-[#737fff] hover:bg-[#5a5fff] text-white"
                    onClick={() => setIsAddExpenseOpen(true)}
                  >
                    Add Expense
                  </Button>
                </div>
              </div>

              {/* Expenses Section */}
              <div className="bg-white rounded-lg border border-[#e0e0e0] p-6 flex flex-col flex-1 min-h-0">
                <h2 className="text-lg font-medium text-[#000000] mb-4">Expenses</h2>

                {/* Search Bar */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a1a1a1] w-4 h-4" />
                  <Input placeholder="Search" className="pl-10 border-[#e0e0e0] bg-[#fafafa]" />
                </div>

                {/* Expense Cycles List */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {isExpensesLoading ? (
                    <div className="text-center py-8 text-[#a1a1a1]">Loading expense cycles...</div>
                  ) : expenseCycles.length === 0 ? (
                    <div className="text-center py-8 text-[#a1a1a1]">No expense cycles found</div>
                  ) : (
                    expenseCycles.map((cycle, index) => {
                    const isExpanded = expandedCycles.includes(cycle.id)
                    return (
                      <div key={cycle.id} className={`bg-[#f6f9ff] rounded-lg border border-[#b8d9ff] ${index > 0 ? 'mt-3' : ''}`}>
                        <div
                          className="flex items-center justify-between p-4 cursor-pointer"
                          onClick={() => toggleCycle(cycle.id)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-[#000000] mb-1">Cycle#:{cycle.id}</div>
                            <div className="text-sm text-[#a1a1a1]">
                              <div>From: {cycle.from}</div>
                              <div>Until: {cycle.until}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-medium text-[#000000]">{cycle.amount.toLocaleString()}</div>
                              <div className="text-sm text-[#a1a1a1]">Total Amount</div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-[#a1a1a1]" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-[#a1a1a1]" />
                            )}
                          </div>
                        </div>

                        {isExpanded && cycle.expenses.length > 0 && (
                          <div className="px-4 pb-4">
                            <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-[#fafafa] border-b border-[#e0e0e0]">
                                  <tr>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-[#000000]">Item</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-[#000000]">Amount</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-[#000000]">Date</th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-[#000000]">
                                      Requested By
                                    </th>
                                    <th className="text-left px-4 py-3 text-sm font-medium text-[#000000]">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cycle.expenses.map((expense, index) => (
                                    <tr key={index} className="border-b border-[#e0e0e0] last:border-b-0">
                                      <td className="px-4 py-3">
                                        <a href="#" className="text-[#737fff] hover:underline text-sm">
                                          {expense.item}
                                        </a>
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#000000]">
                                        {expense.amount.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-3 text-sm text-[#000000]">{expense.date}</td>
                                      <td className="px-4 py-3 text-sm text-[#000000]">{expense.requestedBy}</td>
                                      <td className="px-4 py-3">
                                        <button className="text-[#a1a1a1] hover:text-[#000000]">
                                          <MoreVertical className="w-4 h-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <AddExpenseDialog
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSubmit={handleAddExpense}
      />

      <ConfigurationDialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveConfiguration}
        initialData={configData}
        isLoading={isConfigLoading}
      />
    </div>
  )
}