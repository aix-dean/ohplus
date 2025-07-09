"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { ResponsiveTable } from "@/components/responsive-table"
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface RegistrationCode {
  id: string
  code: string
  usage: number
  maxUsage?: number
  expires: Date
  status: "active" | "inactive"
  company_id: string
  license_key: string
  created_by: string
  created_at: Date
}

export default function RegistrationCodesPage() {
  const { user, userData } = useAuth()
  const [codes, setCodes] = useState<RegistrationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    if (!user || !userData?.company_id) return

    const q = query(collection(db, "registration_codes"), where("company_id", "==", userData.company_id))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const codesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        expires: doc.data().expires?.toDate(),
        created_at: doc.data().created_at?.toDate(),
      })) as RegistrationCode[]

      setCodes(codesData.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()))
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user, userData])

  const generateCode = async () => {
    if (!user || !userData?.company_id) return

    setGenerating(true)
    try {
      const code = generateRandomCode()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days from now

      await addDoc(collection(db, "registration_codes"), {
        code,
        usage: 0,
        expires: expiresAt,
        status: "active",
        company_id: userData.company_id,
        license_key: userData.license_key,
        created_by: user.uid,
        created_at: new Date(),
      })

      toast.success("Registration code generated successfully!")
    } catch (error) {
      console.error("Error generating code:", error)
      toast.error("Failed to generate registration code")
    } finally {
      setGenerating(false)
    }
  }

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      if (i === 4) result += "-"
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Code copied to clipboard!")
    } catch (error) {
      toast.error("Failed to copy code")
    }
  }

  const deactivateCode = async (codeId: string) => {
    try {
      await updateDoc(doc(db, "registration_codes", codeId), {
        status: "inactive",
      })
      toast.success("Code deactivated successfully!")
    } catch (error) {
      console.error("Error deactivating code:", error)
      toast.error("Failed to deactivate code")
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })
  }

  const formatUsage = (code: RegistrationCode) => {
    if (code.maxUsage) {
      return `${code.usage} / ${code.maxUsage}`
    }
    return code.usage.toString()
  }

  const columns = [
    {
      key: "code",
      label: "Code",
      render: (code: RegistrationCode) => (
        <div className="flex items-center gap-2">
          <span className="font-mono">{code.code}</span>
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(code.code)} className="h-6 w-6 p-0">
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
    {
      key: "usage",
      label: "Usage",
      render: (code: RegistrationCode) => formatUsage(code),
    },
    {
      key: "expires",
      label: "Expires",
      render: (code: RegistrationCode) => formatDate(code.expires),
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Registration Codes</h1>
            <p className="text-muted-foreground">Manage registration codes for your organization.</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Registration Codes</h1>
          <p className="text-muted-foreground">Manage registration codes for your organization.</p>
        </div>
        <Button onClick={generateCode} disabled={generating}>
          <Plus className="h-4 w-4 mr-2" />
          {generating ? "Generating..." : "Generate Code"}
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No registration codes found.</p>
        </div>
      ) : (
        <ResponsiveTable data={codes} columns={columns} searchable={false} />
      )}
    </div>
  )
}
