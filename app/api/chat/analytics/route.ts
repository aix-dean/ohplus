import { type NextRequest, NextResponse } from "next/server"
import { getChatAnalytics } from "@/lib/chat-database-service"

export async function GET(req: NextRequest) {
  try {
    const analytics = await getChatAnalytics()
    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching chat analytics:", error)
    return NextResponse.json({ error: "Failed to fetch chat analytics" }, { status: 500 })
  }
}
