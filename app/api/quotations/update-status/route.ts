import { type NextRequest, NextResponse } from "next/server"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { quotationId, status } = await request.json()

    if (!quotationId || !status) {
      return NextResponse.json({ error: "Missing quotationId or status" }, { status: 400 })
    }

    const quotationRef = doc(db, "quotations", quotationId)

    await updateDoc(quotationRef, {
      status: status.toUpperCase(),
      updated: serverTimestamp(),
      ...(status.toLowerCase() === "accepted" && { accepted_at: serverTimestamp() }),
      ...(status.toLowerCase() === "rejected" && { rejected_at: serverTimestamp() }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating quotation status:", error)
    return NextResponse.json({ error: "Failed to update quotation status" }, { status: 500 })
  }
}
