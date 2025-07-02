import { type NextRequest, NextResponse } from "next/server"
import { getMessagesByConversationId, addMessageToConversation } from "@/lib/chat-database-service"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const conversationId = searchParams.get("conversationId")

  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 })
  }

  try {
    const messages = await getMessagesByConversationId(conversationId)
    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { conversationId, sender, content } = await req.json()
    if (!conversationId || !sender || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    const newMessage = await addMessageToConversation(conversationId, sender, content)
    return NextResponse.json(newMessage, { status: 201 })
  } catch (error) {
    console.error("Error adding message:", error)
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 })
  }
}
