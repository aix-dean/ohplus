"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus } from "lucide-react"
import { toast } from "sonner"
import { ResponsiveTable } from "@/components/responsive-table"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from "firebase/firestore"
import { useAuth } from "@/contexts/auth-context"

interface RegistrationCode {
  id: string
  code: string
  usage: number
  maxUsage?: number
  expires: string
  status: "active" | "inactive"
  createdAt: number
  createdBy: string
  company_id?: string
  license_key?: string
}

export default function RegistrationCodesPage() {
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const { user, userData } = useAuth()

  useEffect(() => {
    fetchCodes()
  }, [userData])

  const fetchCodes = async () => {
    if (!userData?.company_id) return

    try {
      const codesCollection = collection(db, "organization_codes")
      const codesQuery = query(codesCollection, where("company_id", "==", userData.company_id))
      const codesSnapshot = await getDocs(codesQuery)

      const fetchedCodes: RegistrationCode[] = codesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        expires: new Date(doc.data().expiresAt).toLocaleDateString(),
        status: doc.data().active && new Date(doc.data().expiresAt) > new Date() ? "active" : "inactive",
      })) as RegistrationCode[]

      setCodes(fetchedCodes.sort((a, b) => b.createdAt - a.createdAt))
    } catch (error) {
      console.error("Error fetching codes:", error)
      toast.error("Failed to fetch registration codes")
    } finally {
      setLoading(false)
    }
  }

  const generateCode = async () => {
    if (!user || !userData?.company_id) {
      toast.error("Unable to generate code. Please try again.")
      return
    }

    setGenerating(true)
    try {
      // Generate 8-character code in XXXX-XXXX format
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
      const part1 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
      const part2 = Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")
      const newCode = `${part1}-${part2}`

      // Set expiration to 30 days from now
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const codeData = {
        code: newCode,
        usage: 0,
        active: true,
        expiresAt: expiresAt.getTime(),
        createdAt: Date.now(),
        createdBy: user.uid,
        company_id: userData.company_id,
        license_key: userData.license_key,
      }

      await addDoc(collection(db, "organization_codes"), codeData)

      toast.success("Registration code generated successfully!")
      fetchCodes() // Refresh the list
    } catch (error) {
      console.error("Error generating code:", error)
      toast.error("Failed to generate registration code")
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy code")
    }
  }

  const deactivateCode = async (codeId: string) => {
    try {
      const codeRef = doc(db, "organization_codes", codeId)
      await updateDoc(codeRef, { active: false })

      toast.success("Code deactivated successfully!")
      fetchCodes() // Refresh the list
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast.error("Failed to deactivate code")
    }
  }

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (code: RegistrationCode) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{code.code}</span>
          <Button variant="ghost" size="sm" onClick={() => copyCode(code.code)} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (code: RegistrationCode) => (
        <span>{code.maxUsage ? `${code.usage} / ${code.maxUsage}` : code.usage}</span>
      ),
    },
    {
      key: "expires",
      label: "Expires",
      render: (code: RegistrationCode) => <span>{code.expires}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (code: RegistrationCode) => (
        <Badge variant={code.status === "active" ? "default" : "secondary"}>
          {code.status === "active" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (code: RegistrationCode) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => deactivateCode(code.id)}
          disabled={code.status === "inactive"}
        >
          Deactivate
        </Button>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading registration codes...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Registration Codes</h1>
          <p className="text-muted-foreground">Manage registration codes for your organization.</p>
        </div>
        <Button onClick={generateCode} disabled={generating}>
          <Plus className="h-4 w-4 mr-2" />
          {generating ? "Generating..." : "Generate Code"}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {codes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No registration codes found.</p>
            </div>
          ) : (
            <ResponsiveTable data={codes} columns={columns} className="border-0" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
