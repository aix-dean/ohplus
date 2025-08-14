import { db } from "./firebase"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"

export interface NotificationData {
  type: string
  title: string
  description: string
  department_to: string
  uid_to?: string
  company_id: string
  department_from: string
  viewed: boolean
  navigate_to: string
  created: any
}

// Department list for sales planner notifications
const DEPARTMENTS = ["Logistics", "Finance", "I.T.", "Admin", "CMS", "Business Dev", "Accounting"]

/**
 * Creates notification documents for multiple departments
 */
export async function createDepartmentNotifications(
  eventTitle: string,
  eventType: string,
  eventDate: Date,
  companyId: string,
  fromDepartment = "Sales",
  navigateUrl?: string,
): Promise<void> {
  try {
    const notificationPromises = DEPARTMENTS.map(async (department) => {
      const notificationData: Omit<NotificationData, "created"> = {
        type: "Sales Event",
        title: `New Sales Event: ${eventTitle}`,
        description: `A new ${eventType} event "${eventTitle}" has been scheduled for ${eventDate.toLocaleDateString()}`,
        department_to: department,
        company_id: companyId,
        department_from: fromDepartment,
        viewed: false,
        navigate_to: navigateUrl || "/sales/planner",
      }

      return addDoc(collection(db, "notifications"), {
        ...notificationData,
        created: serverTimestamp(),
      })
    })

    await Promise.all(notificationPromises)
    console.log(`Successfully created notifications for ${DEPARTMENTS.length} departments`)
  } catch (error) {
    console.error("Error creating department notifications:", error)
    throw error
  }
}

/**
 * Creates a single notification for a specific department
 */
export async function createSingleNotification(notificationData: Omit<NotificationData, "created">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...notificationData,
      created: serverTimestamp(),
    })

    console.log(`Notification created with ID: ${docRef.id}`)
    return docRef.id
  } catch (error) {
    console.error("Error creating single notification:", error)
    throw error
  }
}
