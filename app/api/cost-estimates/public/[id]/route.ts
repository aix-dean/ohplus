import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import type { CostEstimate } from "@/lib/types/cost-estimate"

// Initialize Firebase for server-side use
function getFirebaseApp() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }

  const existingApps = getApps()
  if (existingApps.length === 0) {
    return initializeApp(firebaseConfig)
  }
  return existingApps[0]
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const costEstimateId = params.id

    if (!costEstimateId) {
      return NextResponse.json({ error: "Cost estimate ID is required" }, { status: 400 })
    }

    // Initialize Firebase app and Firestore
    const app = getFirebaseApp()
    const db = getFirestore(app)

    // Get cost estimate directly from Firestore
    const costEstimateDoc = await getDoc(doc(db, "costEstimates", costEstimateId))

    if (!costEstimateDoc.exists()) {
      return NextResponse.json({ error: "Cost estimate not found" }, { status: 404 })
    }

    const data = costEstimateDoc.data()

    // Convert Firestore timestamps to serializable format
    const costEstimate: CostEstimate = {
      id: costEstimateDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      approvedAt: data?.approvedAt?.toDate() || undefined,
      rejectedAt: data?.rejectedAt?.toDate() || undefined,
    } as CostEstimate

    // Only return cost estimates that are not drafts (for security)
    if (costEstimate.status === "draft") {
      return NextResponse.json({ error: "Cost estimate not available" }, { status: 403 })
    }

    // Convert dates to ISO strings for JSON serialization
    const serializedCostEstimate = {
      ...costEstimate,
      createdAt: costEstimate.createdAt.toISOString(),
      updatedAt: costEstimate.updatedAt.toISOString(),
      approvedAt: costEstimate.approvedAt?.toISOString(),
      rejectedAt: costEstimate.rejectedAt?.toISOString(),
      // Don't include the password in the response for security
      password: undefined,
    }

    return NextResponse.json(serializedCostEstimate)
  } catch (error) {
    console.error("Error fetching public cost estimate:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Add POST method for password verification
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const costEstimateId = params.id
    const { password } = await request.json()

    if (!costEstimateId || !password) {
      return NextResponse.json({ error: "Cost estimate ID and password are required" }, { status: 400 })
    }

    // Initialize Firebase app and Firestore
    const app = getFirebaseApp()
    const db = getFirestore(app)

    // Get cost estimate directly from Firestore
    const costEstimateDoc = await getDoc(doc(db, "costEstimates", costEstimateId))

    if (!costEstimateDoc.exists()) {
      return NextResponse.json({ error: "Cost estimate not found" }, { status: 404 })
    }

    const data = costEstimateDoc.data()
    const costEstimate: CostEstimate = {
      id: costEstimateDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      approvedAt: data?.approvedAt?.toDate() || undefined,
      rejectedAt: data?.rejectedAt?.toDate() || undefined,
    } as CostEstimate

    // Only allow access to non-draft cost estimates
    if (costEstimate.status === "draft") {
      return NextResponse.json({ error: "Cost estimate not available" }, { status: 403 })
    }

    // Verify password
    const isPasswordCorrect = costEstimate.password === password

    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Update status to viewed if it was sent
    if (costEstimate.status === "sent") {
      try {
        const { updateCostEstimateStatus } = await import("@/lib/cost-estimate-service")
        await updateCostEstimateStatus(costEstimateId, "viewed")
        costEstimate.status = "viewed"
      } catch (error) {
        console.error("Error updating cost estimate status to viewed:", error)
      }
    }

    // Return cost estimate data without password
    const serializedCostEstimate = {
      ...costEstimate,
      createdAt: costEstimate.createdAt.toISOString(),
      updatedAt: costEstimate.updatedAt.toISOString(),
      approvedAt: costEstimate.approvedAt?.toISOString(),
      rejectedAt: costEstimate.rejectedAt?.toISOString(),
      password: undefined, // Don't include password in response
    }

    return NextResponse.json({ success: true, costEstimate: serializedCostEstimate })
  } catch (error) {
    console.error("Error verifying cost estimate password:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
