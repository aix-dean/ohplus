import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  getDoc,
  writeBatch,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import type { SalesThread, SalesMessage, ChatUser } from "@/lib/types/sales-chat"

class SalesChatService {
  // Create a new chat thread between sales rep and customer
  async createThread(sellerId: string, customerId: string, productId?: string, productName?: string): Promise<string> {
    try {
      // Check if thread already exists between these users
      const existingThreadQuery = query(
        collection(db, "sales_threads"),
        where("participants", "array-contains-any", [sellerId, customerId]),
      )

      const existingThreads = await getDocs(existingThreadQuery)
      const existingThread = existingThreads.docs.find((doc) => {
        const data = doc.data()
        return data.participants.includes(sellerId) && data.participants.includes(customerId)
      })

      if (existingThread) {
        return existingThread.id
      }

      // Get customer info from iboard_users
      const customerDoc = await getDoc(doc(db, "iboard_users", customerId))
      const customerData = customerDoc.exists() ? customerDoc.data() : null

      // Create new thread
      const threadData = {
        participants: [sellerId, customerId],
        receiverId: customerId,
        receiver_name: customerData
          ? `${customerData.first_name || ""} ${customerData.last_name || ""}`.trim()
          : "Customer",
        receiver_photo_url: customerData?.photo_url || null,
        lastMessage: "",
        lastMessageTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        productId: productId || null,
        productName: productName || null,
        status: "active",
        priority: "medium",
      }

      const docRef = await addDoc(collection(db, "sales_threads"), threadData)
      return docRef.id
    } catch (error) {
      console.error("Error creating thread:", error)
      throw error
    }
  }

  // Send a message in a thread
  async sendMessage(threadId: string, senderId: string, text: string, file?: File): Promise<void> {
    try {
      let fileUrl = ""
      let fileName = ""
      let fileType = ""
      let fileSize = 0

      // Upload file if provided
      if (file) {
        const fileRef = ref(storage, `sales-chat/${threadId}/${Date.now()}_${file.name}`)
        const snapshot = await uploadBytes(fileRef, file)
        fileUrl = await getDownloadURL(snapshot.ref)
        fileName = file.name
        fileType = file.type
        fileSize = file.size
      }

      // Create message
      const messageData = {
        threadId,
        senderId,
        text: text || "",
        timestamp: serverTimestamp(),
        read: false,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
      }

      await addDoc(collection(db, "sales_messages"), messageData)

      // Update thread with last message
      await updateDoc(doc(db, "sales_threads", threadId), {
        lastMessage: text || (file ? `Sent ${file.name}` : ""),
        lastMessageTimestamp: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  // Listen to threads for a user
  listenToThreads(userId: string, callback: (threads: SalesThread[]) => void): () => void {
    const q = query(
      collection(db, "sales_threads"),
      where("participants", "array-contains", userId),
      orderBy("lastMessageTimestamp", "desc"),
    )

    return onSnapshot(q, (snapshot) => {
      const threads: SalesThread[] = []
      snapshot.forEach((doc) => {
        threads.push({ id: doc.id, ...doc.data() } as SalesThread)
      })
      callback(threads)
    })
  }

  // Listen to messages in a thread
  listenToMessages(threadId: string, callback: (messages: SalesMessage[]) => void): () => void {
    const q = query(collection(db, "sales_messages"), where("threadId", "==", threadId), orderBy("timestamp", "asc"))

    return onSnapshot(q, (snapshot) => {
      const messages: SalesMessage[] = []
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as SalesMessage)
      })
      callback(messages)
    })
  }

  // Mark messages as read
  async markMessagesAsRead(threadId: string, userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, "sales_messages"),
        where("threadId", "==", threadId),
        where("senderId", "!=", userId),
        where("read", "==", false),
      )

      const snapshot = await getDocs(q)
      const batch = writeBatch(db)

      snapshot.forEach((doc) => {
        batch.update(doc.ref, { read: true })
      })

      await batch.commit()
    } catch (error) {
      console.error("Error marking messages as read:", error)
    }
  }

  // Get sales team members (for customer list)
  async getSalesTeamMembers(): Promise<ChatUser[]> {
    try {
      const q = query(collection(db, "iboard_users"), where("role", "in", ["admin", "sales", "customer"]))

      const snapshot = await getDocs(q)
      const users: ChatUser[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        users.push({
          id: doc.id,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.email || "Unknown",
          email: data.email || "",
          photoUrl: data.photo_url || null,
          department: data.department || null,
          role: data.role || "customer",
          isOnline: false, // This would need real-time presence tracking
          lastSeen: data.last_seen || null,
        })
      })

      return users
    } catch (error) {
      console.error("Error getting sales team members:", error)
      return []
    }
  }

  // Archive a thread
  async archiveThread(threadId: string): Promise<void> {
    try {
      await updateDoc(doc(db, "sales_threads", threadId), {
        status: "archived",
      })
    } catch (error) {
      console.error("Error archiving thread:", error)
      throw error
    }
  }

  // Set thread priority
  async setThreadPriority(threadId: string, priority: "low" | "medium" | "high" | "urgent"): Promise<void> {
    try {
      await updateDoc(doc(db, "sales_threads", threadId), {
        priority,
      })
    } catch (error) {
      console.error("Error setting thread priority:", error)
      throw error
    }
  }
}

export const salesChatService = new SalesChatService()
