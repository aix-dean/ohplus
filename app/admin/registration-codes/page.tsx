"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { ResponsiveTable } from "@/components/responsive-table"

interface RegistrationCode {
  id: string
  code: string
  company_id: string
  license_key: string
  created_by: string
  created_at: any
  expires_at: Date
  used: boolean
  usage_count: number
  max_usage?: number
  active: boolean
}

export default function RegistrationCodesPage() {
  const { user, userData } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [generatingCode, setGeneratingCode] = useState(false)

  useEffect(() => {
    if (!user && !loading) {
      router.push("/login")
    } else if (user && userData) {
      fetchRegistrationCodes()
    }
  }, [user, userData, router, loading])

  const fetchRegistrationCodes = async () => {
    if (!userData?.license_key) return

    try {
      const codesQuery = query(
        collection(db, "organization_codes"),
        where("license_key", "==", userData.license_key),
        orderBy("created_at", "desc"),
      )

      const codesSnapshot = await getDocs(codesQuery)
      const codesData = codesSnapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.id,
        ...doc.data(),
        expires_at: doc.data().expires_at?.toDate() || new Date(),
        usage_count: doc.data().usage_count || 0,
        active: doc.data().active !== false && !doc.data().used && doc.data().expires_at?.toDate() > new Date(),
      })) as RegistrationCode[]

      setCodes(codesData)
    } catch (error) {
      console.error("Error fetching registration codes:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch registration codes.",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    if (!userData?.company_id || !userData?.license_key) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Company information not found. Please register your company first.",
      })
      return
    }

    try {
      setGeneratingCode(true)

      // Generate a unique 8-character code in format XXXX-XXXX
      const generateCodeString = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
        const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
        return `${part1}-${part2}`
      }

      const code = generateCodeString()

      // Set expiration to 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      // Save the organization code
      await setDoc(doc(db, "organization_codes", code), {
        company_id: userData.company_id,
        license_key: userData.license_key,
        created_by: user?.uid,
        created_at: serverTimestamp(),
        expires_at: expiresAt,
        used: false,
        usage_count: 0,
        max_usage: null, // Unlimited usage
        active: true,
      })

      toast({
        title: "Registration Code Generated",
        description: `Code: ${code} (expires in 30 days)`,
      })

      // Refresh the codes list
      fetchRegistrationCodes()
    } catch (error) {
      console.error("Error generating registration code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate registration code. Please try again.",
      })
    } finally {
      setGeneratingCode(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast({
      title: "Copied to clipboard!",
      description: `Code ${code} has been copied.`,
    })
  }

  const handleDeactivateCode = async (codeId: string) => {
    try {
      await updateDoc(doc(db, "organization_codes", codeId), {
        active: false,
      })

      toast({
        title: "Code Deactivated",
        description: "The registration code has been deactivated.",
      })

      // Refresh the codes list
      fetchRegistrationCodes()
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to deactivate code. Please try again.",
      })
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })
  }

  const getUsageDisplay = (code: RegistrationCode) => {
    if (code.max_usage) {
      return `${code.usage_count} / ${code.max_usage}`
    }
    return code.usage_count.toString()
  }

  const columns = [
    {
      header: "Code",
      accessorKey: "code" as keyof RegistrationCode,
      cell: (row: RegistrationCode) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{row.code}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleCopyCode(row.code)}>
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      header: "Usage",
      accessorKey: "usage_count" as keyof RegistrationCode,
      cell: (row: RegistrationCode) => getUsageDisplay(row),
    },
    {
      header: "Expires",
      accessorKey: "expires_at" as keyof RegistrationCode,
      cell: (row: RegistrationCode) => formatDate(row.expires_at),
    },
    {
      header: "Status",
      accessorKey: "active" as keyof RegistrationCode,
      cell: (row: RegistrationCode) => (
        <Badge
          variant={row.active ? "default" : "secondary"}
          className={
            row.active ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-red-100 text-red-800 hover:bg-red-100"
          }
        >
          {row.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id" as keyof RegistrationCode,
      cell: (row: RegistrationCode) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDeactivateCode(row.code)}
          disabled={!row.active}
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          Deactivate
        </Button>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Registration Codes...</h2>
          <p className="text-gray-500">Please wait while we fetch your codes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Registration Codes</h1>
          <p className="text-gray-600 mt-1">Manage registration codes for your organization.</p>
        </div>
        <Button
          onClick={handleGenerateCode}
          disabled={generatingCode}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {generatingCode ? (
            <>
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Generate Code</span>
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <ResponsiveTable
            data={codes}
            columns={columns}
            keyField="id"
            isLoading={loading}
            emptyState={
              <div className="text-center py-8">
                <p className="text-gray-500">No registration codes found.</p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  )
}
