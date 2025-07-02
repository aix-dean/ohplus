"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AssistantChat } from "@/components/ai-assistant/assistant-chat"
import { AssistantChatOptimized } from "@/components/ai-assistant/assistant-chat-optimized"
import { AssistantChatWithDB } from "@/components/ai-assistant/assistant-chat-with-db"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, MessageCircle, Zap, BookOpen, HelpCircle, Search, ChevronDown, Plus } from "lucide-react"
import { usePathname } from "next/navigation"
import { chatDB } from "@/lib/chat-database-service"
import type { ChatMessage } from "@/lib/gemini-service"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"

const suggestedQuestions = [
  "How do I create a new proposal?",
  "How do I send quotations via email?",
  "How do I generate a quotation from a proposal?",
  "How do I manage client information",
  "How do I track quotation responses?",
  "How do I create service assignments?",
  "How do I schedule content with weather data?",
  "How do I use the sales chat system?",
  "How do I configure user permissions?",
  "How do I monitor site performance?",
  "How do I share proposals with clients?",
  "How do I download quotations as PDF?",
]

const quickActions = [
  {
    title: "Sales Dashboard",
    description: "View sales metrics and performance analytics",
    href: "/sales/dashboard",
    icon: "📊",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    title: "Create Proposal",
    description: "Generate comprehensive business proposals",
    href: "/sales/proposals",
    icon: "📋",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    title: "Send Quotation",
    description: "Email professional quotations to clients",
    href: "/sales/quotation-requests",
    icon: "📧",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    title: "Service Assignments",
    description: "Manage logistics and maintenance tasks",
    href: "/logistics/assignments",
    icon: "🚚",
    gradient: "from-orange-500 to-red-500",
  },
]

const recentUpdates = [
  {
    title: "Enhanced Proposal System",
    description: "Create detailed proposals and generate quotations with email delivery",
    badge: "New",
    badgeColor: "bg-gradient-to-r from-green-500 to-emerald-500",
  },
  {
    title: "Full-Screen Chat Interface",
    description: "Dedicated chat page for seamless OHLIVER AI interactions",
    badge: "Enhanced",
    badgeColor: "bg-gradient-to-r from-blue-500 to-cyan-500",
  },
  {
    title: "Weather-Integrated Planning",
    description: "Content and logistics planning with real-time weather data",
    badge: "Enhanced",
    badgeColor: "bg-gradient-to-r from-purple-500 to-pink-500",
  },
]

const helpCategories = [
  {
    icon: <MessageCircle className="h-6 w-6" />,
    title: "Sales & Prop Props",
    description: "Proposals, quotations, client management, and team chat",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Logistics Operations",
    description: "Service assignments, site monitoring, and weather integration",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Content Management",
    description: "Publishing schedules, content orders, and weather-based planning",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: <HelpCircle className="h-6 w-6" />,
    title: "System Administration",
    description: "User management, access control, and system configuration",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
]

export default function AIAssistantPage() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      parts:
        "Hello! I'm OHLIVER, your OH Plus AI Assistant. I'm here to help you navigate the platform, answer questions, and guide you through any tasks. What would you like to know?",
    },
  ])
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionId] = useState(() => chatDB.generateSessionId())
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const [isInitialized, setIsInitialized] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("All")

  // Get authenticated user data from auth context
  const { user, userData } = useAuth()

  // Use actual user data or fallback for unauthenticated users
  const userId = user?.uid || userData?.uid || "anonymous"
  const userEmail = user?.email || userData?.email || "anonymous@example.com"
  const userName = userData?.display_name || userData?.first_name || "Anonymous User"

  // Get current page context
  const getCurrentPageContext = useCallback(() => {
    const pathSegments = pathname.split("/").filter(Boolean)
    if (pathSegments.length === 0) return "Home"

    const pageMap: Record<string, string> = {
      sales: "Sales",
      logistics: "Logistics",
      cms: "Content Management",
      admin: "Administration",
      settings: "Settings",
      help: "Help & Documentation",
      dashboard: "Dashboard",
      planner: "Planner",
      clients: "Clients",
      bookings: "Bookings",
      products: "Products",
      inventory: "Inventory",
    }

    return pathSegments.map((segment) => pageMap[segment] || segment).join(" > ")
  }, [pathname])

  // Initialize conversation once and cache it
  const initializeConversation = useCallback(async () => {
    if (conversationId || isInitialized) return conversationId

    try {
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userEmail,
          currentPage: getCurrentPageContext(),
          sessionId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.conversationId)
        setIsInitialized(true)
        return data.conversationId
      }
    } catch (error) {
      console.error("Error initializing conversation:", error)
    }
    return null
  }, [conversationId, isInitialized, getCurrentPageContext, sessionId, userId, userEmail])

  // Background save function (non-blocking)
  const saveMessageInBackground = useCallback(
    async (convId: string, role: "user" | "model", content: string, responseTime?: number) => {
      fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          role,
          content,
          currentPage: getCurrentPageContext(),
          responseTime,
        }),
      }).catch((error) => {
        console.error("Background save failed:", error)
      })
    },
    [getCurrentPageContext],
  )

  const handleSendMessage = useCallback(
    async (messageText?: string) => {
      const userInput = messageText || input.trim()
      if (!userInput || isAiThinking) return

      // Clear input if using the input field
      if (!messageText) setInput("")
      setIsAiThinking(true)

      // Add user message and loading message
      setMessages((prev) => {
        const userMessage: ChatMessage = {
          role: "user",
          parts: userInput,
        }

        const loadingMessage: ChatMessage = {
          role: "model",
          parts: "",
          isLoading: true,
        }

        return [...prev, userMessage, loadingMessage]
      })

      const startTime = Date.now()

      try {
        // Start conversation initialization and AI request in parallel
        const [convId, aiResponse] = await Promise.all([
          initializeConversation(),
          fetch("/api/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [...messages, { role: "user", parts: userInput }],
              currentPage: getCurrentPageContext(),
              userId,
              userEmail,
              userName,
            }),
          }),
        ])

        if (!aiResponse.ok) {
          throw new Error("Failed to get AI response")
        }

        const data = await aiResponse.json()
        const responseTime = Date.now() - startTime

        // Replace loading message with actual AI response
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: "model",
            parts: data.response.parts,
            isLoading: false,
          }
          return newMessages
        })

        // Background save
        if (convId) {
          saveMessageInBackground(convId, "user", userInput)
          saveMessageInBackground(convId, "model", data.response.parts, responseTime)
        }
      } catch (error) {
        console.error("Error sending message:", error)

        // Replace loading message with error message
        setMessages((prev) => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = {
            role: "model",
            parts: "I'm sorry, I encountered an error. Please try again later.",
            isLoading: false,
          }
          return newMessages
        })
      } finally {
        setIsAiThinking(false)
      }
    },
    [
      input,
      isAiThinking,
      messages,
      initializeConversation,
      getCurrentPageContext,
      saveMessageInBackground,
      userId,
      userEmail,
      userName,
    ],
  )

  // Handle conversation rating
  const handleRating = useCallback(
    async (stars: number) => {
      setRating(stars)
      setShowRating(false)

      if (conversationId) {
        chatDB.rateConversation(conversationId, stars).catch((error) => {
          console.error("Error rating conversation:", error)
        })
      }
    },
    [conversationId],
  )

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Handle Enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  // Show rating after multiple messages
  useEffect(() => {
    if (messages.length >= 6 && !showRating && rating === 0) {
      setShowRating(true)
    }
  }, [messages.length, showRating, rating])

  // Initialize conversation in background when component mounts
  useEffect(() => {
    if (userId && userEmail) {
      initializeConversation().then((convId) => {
        if (convId && messages.length > 0 && messages[0].role === "model") {
          saveMessageInBackground(convId, "model", messages[0].parts)
        }
      })
    }
  }, [userId, userEmail]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Glassmorphism */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5">
                  <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center">
                    <Image src="/ohliver-mascot.png" alt="OHLIVER" width={40} height={40} className="rounded-xl" />
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-2">
                  OHLIVER AI Assistant
                  <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
                </h1>
                <p className="text-gray-600 font-medium">Your intelligent OH Plus companion</p>
              </div>
            </div>
            {userName !== "Anonymous User" && (
              <div className="flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Welcome back,</p>
                  <p className="text-sm font-semibold text-gray-900">{userName.split(" ")[0]}!</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold">AI Assistant</h1>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search conversations..."
                  className="w-full rounded-lg bg-background pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    Filter: {selectedFilter} <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedFilter("All")}>All</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Sales")}>Sales</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Support")}>Support</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedFilter("Technical")}>Technical</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" /> New Chat
              </Button>
            </div>
          </div>

          {/* AI Assistant Chat Interface */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basic Chat</TabsTrigger>
              <TabsTrigger value="optimized">Optimized Chat</TabsTrigger>
              <TabsTrigger value="with-db">Chat with DB</TabsTrigger>
            </TabsList>
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssistantChat />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="optimized">
              <Card>
                <CardHeader>
                  <CardTitle>Optimized AI Assistant</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssistantChatOptimized />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="with-db">
              <Card>
                <CardHeader>
                  <CardTitle>AI Assistant with Database Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <AssistantChatWithDB />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
