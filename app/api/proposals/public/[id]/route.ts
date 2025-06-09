import { type NextRequest, NextResponse } from "next/server"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import type { Proposal } from "@/lib/types/proposal"
import { logProposalViewed } from "@/lib/proposal-activity-service"

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
    const proposalId = params.id
    console.log("Fetching public proposal with ID:", proposalId)

    if (!proposalId) {
      console.log("No proposal ID provided")
      return NextResponse.json({ error: "Proposal ID is required" }, { status: 400 })
    }

    // Initialize Firebase app and Firestore
    const app = getFirebaseApp()
    const db = getFirestore(app)
    console.log("Firebase app and Firestore initialized")

    // Get proposal directly from Firestore
    const proposalDoc = await getDoc(doc(db, "proposals", proposalId))
    console.log("Proposal document exists:", proposalDoc.exists())

    if (!proposalDoc.exists()) {
      console.log("Proposal document not found in Firestore")
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    const data = proposalDoc.data()
    console.log("Proposal data status:", data?.status)

    // Convert Firestore timestamps to serializable format
    const proposal: Proposal = {
      id: proposalDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      validUntil: data?.validUntil?.toDate() || new Date(),
    } as Proposal

    // Only return proposals that are not drafts (for security)
    if (proposal.status === "draft") {
      console.log("Proposal is draft, access denied")
      return NextResponse.json({ error: "Proposal not available" }, { status: 403 })
    }

    console.log("Successfully returning proposal:", proposal.title)

    // Convert dates to ISO strings for JSON serialization
    const serializedProposal = {
      ...proposal,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      validUntil: proposal.validUntil.toISOString(),
      // Don't include the password in the response for security
      password: undefined,
    }

    return NextResponse.json(serializedProposal)
  } catch (error) {
    console.error("Error fetching public proposal:", error)
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
    const proposalId = params.id
    const { password } = await request.json()

    console.log("Verifying password for proposal:", proposalId)

    if (!proposalId || !password) {
      return NextResponse.json({ error: "Proposal ID and password are required" }, { status: 400 })
    }

    // Initialize Firebase app and Firestore
    const app = getFirebaseApp()
    const db = getFirestore(app)

    // Get proposal directly from Firestore
    const proposalDoc = await getDoc(doc(db, "proposals", proposalId))

    if (!proposalDoc.exists()) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
    }

    const data = proposalDoc.data()
    const proposal: Proposal = {
      id: proposalDoc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || new Date(),
      validUntil: data?.validUntil?.toDate() || new Date(),
    } as Proposal

    // Only allow access to non-draft proposals
    if (proposal.status === "draft") {
      return NextResponse.json({ error: "Proposal not available" }, { status: 403 })
    }

    // Verify password
    const isPasswordCorrect = proposal.password === password

    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    console.log("Password verified successfully for proposal:", proposal.title)

    // Log the proposal view with location tracking
    try {
      await logProposalViewed(proposalId, "public_viewer", "Public Viewer", request)
    } catch (error) {
      console.error("Error logging proposal view:", error)
      // Don't fail the request if logging fails
    }

    // Return proposal data without password
    const serializedProposal = {
      ...proposal,
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      validUntil: proposal.validUntil.toISOString(),
      password: undefined, // Don't include password in response
    }

    return NextResponse.json({ success: true, proposal: serializedProposal })
  } catch (error) {
    console.error("Error verifying proposal password:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
