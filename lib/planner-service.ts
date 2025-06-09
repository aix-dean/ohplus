import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { addDays, addMonths, addWeeks, addYears } from "date-fns"

// Define recurrence types
export type RecurrenceType = "none" | "daily" | "weekly" | "monthly" | "yearly"

// Define the SalesEvent interface
export interface SalesEvent {
  id: string
  title: string
  start: Timestamp | Date
  end: Timestamp | Date
  location: string
  status: "scheduled" | "completed" | "cancelled" | "pending"
  type: "meeting" | "call" | "presentation" | "follow-up"
  clientId: string
  clientName: string
  description?: string
  createdBy: string
  createdAt: Timestamp | Date
  updatedAt: Timestamp | Date
  color?: string
  allDay?: boolean
  reminder?: boolean
  reminderTime?: number // minutes before event
  attachments?: { name: string; url: string; type: string }[]
  // Recurrence properties
  recurrence?: {
    type: RecurrenceType
    interval: number // How many days/weeks/months/years between occurrences
    endDate?: Timestamp | Date // Optional end date for the recurrence
    count?: number // Optional number of occurrences
    daysOfWeek?: number[] // For weekly recurrence (0 = Sunday, 6 = Saturday)
    dayOfMonth?: number // For monthly recurrence
    monthOfYear?: number // For yearly recurrence
  }
  // For recurring event instances
  isRecurringInstance?: boolean
  originalEventId?: string // Reference to the original event for recurring instances
  recurrenceException?: boolean // If this instance is an exception to the recurrence pattern
}

// Convert Firestore data to SalesEvent
export function convertToSalesEvent(id: string, data: any): SalesEvent {
  return {
    id,
    title: data.title || "",
    start: data.start instanceof Timestamp ? data.start.toDate() : new Date(data.start),
    end: data.end instanceof Timestamp ? data.end.toDate() : new Date(data.end),
    location: data.location || "",
    status: data.status || "pending",
    type: data.type || "meeting",
    clientId: data.clientId || "",
    clientName: data.clientName || "",
    description: data.description || "",
    createdBy: data.createdBy || "",
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
    color: data.color,
    allDay: data.allDay || false,
    reminder: data.reminder || false,
    reminderTime: data.reminderTime,
    attachments: data.attachments || [],
    recurrence: data.recurrence,
    isRecurringInstance: data.isRecurringInstance || false,
    originalEventId: data.originalEventId,
    recurrenceException: data.recurrenceException || false,
  }
}

// Get all sales events for a user
export async function getSalesEvents(userId: string): Promise<SalesEvent[]> {
  try {
    const eventsRef = collection(db, "planner")
    const q = query(eventsRef, where("createdBy", "==", userId), orderBy("start", "asc"))
    const querySnapshot = await getDocs(q)

    const events: SalesEvent[] = []
    querySnapshot.forEach((doc) => {
      events.push(convertToSalesEvent(doc.id, doc.data()))
    })

    return events
  } catch (error) {
    console.error("Error fetching sales events:", error)
    return []
  }
}

// Get sales events for a specific date range, including recurring events
export async function getSalesEventsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<SalesEvent[]> {
  try {
    const eventsRef = collection(db, "planner")
    const startTimestamp = Timestamp.fromDate(startDate)
    const endTimestamp = Timestamp.fromDate(endDate)

    // Query events that start within the date range
    const q = query(eventsRef, where("createdBy", "==", userId), orderBy("start", "asc"))

    const querySnapshot = await getDocs(q)

    const events: SalesEvent[] = []

    querySnapshot.forEach((doc) => {
      const event = convertToSalesEvent(doc.id, doc.data())

      // Check if the event is within the date range
      if (event.start instanceof Date && event.end instanceof Date) {
        // For non-recurring events, check if they fall within the date range
        if (!event.recurrence || event.recurrence.type === "none") {
          if (event.start <= endDate && event.end >= startDate) {
            events.push(event)
          }
        } else {
          // For recurring events, generate instances within the date range
          const recurringEvents = generateRecurringEventInstances(event, startDate, endDate)
          events.push(...recurringEvents)
        }
      }
    })

    return events
  } catch (error) {
    console.error("Error fetching sales events by date range:", error)
    return []
  }
}

// Generate recurring event instances for a given date range
function generateRecurringEventInstances(event: SalesEvent, startDate: Date, endDate: Date): SalesEvent[] {
  if (!(event.start instanceof Date) || !(event.end instanceof Date) || !event.recurrence) {
    return [event]
  }

  const instances: SalesEvent[] = []
  const recurrence = event.recurrence
  const eventDuration = event.end.getTime() - event.start.getTime()

  // Determine the recurrence end date
  let recurrenceEndDate: Date | undefined
  if (recurrence.endDate) {
    recurrenceEndDate = recurrence.endDate instanceof Date ? recurrence.endDate : recurrence.endDate.toDate()
  }

  // Use the smaller of the query end date or recurrence end date
  const effectiveEndDate = recurrenceEndDate && recurrenceEndDate < endDate ? recurrenceEndDate : endDate

  // Start with the original event
  let currentDate = new Date(event.start)
  let instanceCount = 0
  const maxCount = recurrence.count || 1000 // Limit to prevent infinite loops

  while (currentDate <= effectiveEndDate && instanceCount < maxCount) {
    // Check if this instance falls within our date range
    if (currentDate >= startDate && currentDate <= endDate) {
      const instanceStart = new Date(currentDate)
      const instanceEnd = new Date(instanceStart.getTime() + eventDuration)

      // Create a new instance of the event
      const instance: SalesEvent = {
        ...event,
        id: `${event.id}-instance-${instanceCount}`,
        start: instanceStart,
        end: instanceEnd,
        isRecurringInstance: true,
        originalEventId: event.id,
      }

      instances.push(instance)
    }

    // Move to the next occurrence based on recurrence type
    switch (recurrence.type) {
      case "daily":
        currentDate = addDays(currentDate, recurrence.interval)
        break
      case "weekly":
        currentDate = addWeeks(currentDate, recurrence.interval)
        break
      case "monthly":
        currentDate = addMonths(currentDate, recurrence.interval)
        break
      case "yearly":
        currentDate = addYears(currentDate, recurrence.interval)
        break
      default:
        // Exit the loop for non-recurring events
        instanceCount = maxCount
    }

    instanceCount++
  }

  return instances
}

// Get a single sales event by ID
export async function getSalesEventById(eventId: string, userId: string): Promise<SalesEvent | null> {
  try {
    const eventDoc = await getDoc(doc(db, "planner", eventId))

    if (eventDoc.exists()) {
      const event = convertToSalesEvent(eventDoc.id, eventDoc.data())

      // Ensure the event belongs to the user
      if (event.createdBy === userId) {
        return event
      }
    }

    return null
  } catch (error) {
    console.error("Error fetching sales event:", error)
    return null
  }
}

// Create a new sales event
export async function createSalesEvent(
  userId: string,
  eventData: Omit<SalesEvent, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  try {
    // Convert Date objects to Firestore Timestamps
    const startTimestamp = eventData.start instanceof Date ? Timestamp.fromDate(eventData.start) : eventData.start
    const endTimestamp = eventData.end instanceof Date ? Timestamp.fromDate(eventData.end) : eventData.end

    // Convert recurrence end date if it exists
    let recurrence = eventData.recurrence
    if (recurrence && recurrence.endDate && recurrence.endDate instanceof Date) {
      recurrence = {
        ...recurrence,
        endDate: Timestamp.fromDate(recurrence.endDate),
      }
    }

    const newEvent = {
      ...eventData,
      start: startTimestamp,
      end: endTimestamp,
      recurrence,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, "planner"), newEvent)
    return docRef.id
  } catch (error) {
    console.error("Error creating sales event:", error)
    throw error
  }
}

// Update an existing sales event
export async function updateSalesEvent(eventId: string, eventData: Partial<SalesEvent>, userId: string): Promise<void> {
  try {
    // First verify the event belongs to the user
    const eventDoc = await getDoc(doc(db, "planner", eventId))
    if (!eventDoc.exists() || eventDoc.data().createdBy !== userId) {
      throw new Error("Unauthorized: You can only update your own events")
    }

    const eventRef = doc(db, "planner", eventId)

    // Convert Date objects to Firestore Timestamps if they exist
    const updateData: any = { ...eventData, updatedAt: serverTimestamp() }

    if (eventData.start instanceof Date) {
      updateData.start = Timestamp.fromDate(eventData.start)
    }

    if (eventData.end instanceof Date) {
      updateData.end = Timestamp.fromDate(eventData.end)
    }

    // Convert recurrence end date if it exists
    if (updateData.recurrence && updateData.recurrence.endDate instanceof Date) {
      updateData.recurrence = {
        ...updateData.recurrence,
        endDate: Timestamp.fromDate(updateData.recurrence.endDate),
      }
    }

    await updateDoc(eventRef, updateData)
  } catch (error) {
    console.error("Error updating sales event:", error)
    throw error
  }
}

// Delete a sales event
export async function deleteSalesEvent(eventId: string, userId: string): Promise<void> {
  try {
    // First verify the event belongs to the user
    const eventDoc = await getDoc(doc(db, "planner", eventId))
    if (!eventDoc.exists() || eventDoc.data().createdBy !== userId) {
      throw new Error("Unauthorized: You can only delete your own events")
    }

    const eventRef = doc(db, "planner", eventId)
    await deleteDoc(eventRef)
  } catch (error) {
    console.error("Error deleting sales event:", error)
    throw error
  }
}

// Search sales events by term
export async function searchSalesEvents(userId: string, searchTerm: string): Promise<SalesEvent[]> {
  try {
    // Fetch all user events and filter client-side
    // For production with large datasets, consider using Algolia or Firestore's array-contains
    const events = await getSalesEvents(userId)

    if (!searchTerm) return events

    const searchLower = searchTerm.toLowerCase()
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchLower) ||
        event.clientName.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower)),
    )
  } catch (error) {
    console.error("Error searching sales events:", error)
    return []
  }
}

// Get events by client
export async function getSalesEventsByClient(userId: string, clientId: string): Promise<SalesEvent[]> {
  try {
    const eventsRef = collection(db, "planner")
    const q = query(
      eventsRef,
      where("createdBy", "==", userId),
      where("clientId", "==", clientId),
      orderBy("start", "asc"),
    )

    const querySnapshot = await getDocs(q)

    const events: SalesEvent[] = []
    querySnapshot.forEach((doc) => {
      events.push(convertToSalesEvent(doc.id, doc.data()))
    })

    return events
  } catch (error) {
    console.error("Error fetching sales events by client:", error)
    return []
  }
}

// Get events by type
export async function getSalesEventsByType(userId: string, type: SalesEvent["type"]): Promise<SalesEvent[]> {
  try {
    const eventsRef = collection(db, "planner")
    const q = query(eventsRef, where("createdBy", "==", userId), where("type", "==", type), orderBy("start", "asc"))

    const querySnapshot = await getDocs(q)

    const events: SalesEvent[] = []
    querySnapshot.forEach((doc) => {
      events.push(convertToSalesEvent(doc.id, doc.data()))
    })

    return events
  } catch (error) {
    console.error(`Error fetching sales events by type (${type}):`, error)
    return []
  }
}

// Get events by status
export async function getSalesEventsByStatus(userId: string, status: SalesEvent["status"]): Promise<SalesEvent[]> {
  try {
    const eventsRef = collection(db, "planner")
    const q = query(eventsRef, where("createdBy", "==", userId), where("status", "==", status), orderBy("start", "asc"))

    const querySnapshot = await getDocs(q)

    const events: SalesEvent[] = []
    querySnapshot.forEach((doc) => {
      events.push(convertToSalesEvent(doc.id, doc.data()))
    })

    return events
  } catch (error) {
    console.error(`Error fetching sales events by status (${status}):`, error)
    return []
  }
}
