import { type NextRequest, NextResponse } from "next/server"
import { getConversations, createConversation } from "@/lib/chat-database-service"

export async function GET(req: NextRequest) {
  try {
    const conversations = await getConversations()
    return NextResponse.json(conversations)
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    const newConversation = await createConversation(title)
    return NextResponse.json(newConversation, { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
  }
}
