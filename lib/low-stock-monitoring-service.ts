import { collection, query, where, onSnapshot, getDocs, orderBy, type Unsubscribe } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface LowStockAlert {
  id: string
  itemId: string
  itemName: string
  currentStock: number
  threshold: number
  category: string
  brand: string
  department: string
  assignedTo: string
  alertLevel: "warning" | "critical"
  timestamp: Date
}

export interface InventoryItem {
  id: string
  name: string
  stock: number
  category: string
  brand: string
  department: string
  assignedTo: string
  status: "active" | "inactive" | "maintenance" | "retired"
  company_id: string
  deleted: boolean
}

export interface User {
  id: string
  uid: string
  first_name: string
  last_name: string
  email: string
  company_id?: string
  department?: string
}

export class LowStockMonitoringService {
  private static instance: LowStockMonitoringService
  private unsubscribe: Unsubscribe | null = null
  private alertCallbacks: ((alerts: LowStockAlert[]) => void)[] = []
  private currentAlerts: LowStockAlert[] = []
  private readonly STOCK_THRESHOLD = 3
  private users: User[] = []

  private constructor() {}

  static getInstance(): LowStockMonitoringService {
    if (!LowStockMonitoringService.instance) {
      LowStockMonitoringService.instance = new LowStockMonitoringService()
    }
    return LowStockMonitoringService.instance
  }

  // Initialize monitoring for a specific company
  async startMonitoring(companyId: string): Promise<void> {
    if (this.unsubscribe) {
      this.stopMonitoring()
    }

    // Load users for display names
    await this.loadUsers(companyId)

    // Set up real-time listener for IT inventory items
    const itemsRef = collection(db, "itInventory")
    const q = query(
      itemsRef,
      where("company_id", "==", companyId),
      where("deleted", "==", false),
      where("status", "==", "active"),
      orderBy("stock", "asc"),
    )

    this.unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const lowStockItems: LowStockAlert[] = []

        snapshot.forEach((doc) => {
          const item = { id: doc.id, ...doc.data() } as InventoryItem

          // Check if stock is at or below threshold
          if (item.stock <= this.STOCK_THRESHOLD) {
            const alert: LowStockAlert = {
              id: `alert_${item.id}_${Date.now()}`,
              itemId: item.id,
              itemName: item.name,
              currentStock: item.stock,
              threshold: this.STOCK_THRESHOLD,
              category: item.category,
              brand: item.brand,
              department: item.department,
              assignedTo: item.assignedTo,
              alertLevel: item.stock === 0 ? "critical" : "warning",
              timestamp: new Date(),
            }
            lowStockItems.push(alert)
          }
        })

        // Update current alerts and notify callbacks
        this.currentAlerts = lowStockItems
        this.notifyCallbacks()
      },
      (error) => {
        console.error("Error monitoring stock levels:", error)
      },
    )
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }
    this.currentAlerts = []
  }

  // Subscribe to alerts
  onAlertsChanged(callback: (alerts: LowStockAlert[]) => void): () => void {
    this.alertCallbacks.push(callback)

    // Immediately call with current alerts
    callback(this.currentAlerts)

    // Return unsubscribe function
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  // Get current alerts
  getCurrentAlerts(): LowStockAlert[] {
    return [...this.currentAlerts]
  }

  // Get alerts count
  getAlertsCount(): number {
    return this.currentAlerts.length
  }

  // Get critical alerts count
  getCriticalAlertsCount(): number {
    return this.currentAlerts.filter((alert) => alert.alertLevel === "critical").length
  }

  // Load users for display names
  private async loadUsers(companyId: string): Promise<void> {
    try {
      const usersRef = collection(db, "iboard_users")
      const q = query(usersRef, where("company_id", "==", companyId))
      const querySnapshot = await getDocs(q)

      this.users = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        this.users.push({
          id: doc.id,
          uid: data.uid,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          company_id: data.company_id,
          department: data.department || "",
        })
      })
    } catch (error) {
      console.error("Error loading users:", error)
    }
  }

  // Get user display name
  getUserDisplayName(uid: string): string {
    if (uid === "unassigned") return "Unassigned"
    const user = this.users.find((u) => u.uid === uid)
    if (!user) return "Unknown User"
    return `${user.first_name} ${user.last_name}`.trim() || user.email
  }

  // Get all users for notification distribution
  getAllUsers(): User[] {
    return [...this.users]
  }

  // Get users by department
  getUsersByDepartment(department: string): User[] {
    return this.users.filter((user) => user.department?.toLowerCase() === department.toLowerCase())
  }

  // Notify all callbacks
  private notifyCallbacks(): void {
    this.alertCallbacks.forEach((callback) => {
      try {
        callback(this.currentAlerts)
      } catch (error) {
        console.error("Error in alert callback:", error)
      }
    })
  }

  // Check if item needs restocking
  isLowStock(stock: number): boolean {
    return stock <= this.STOCK_THRESHOLD
  }

  // Get stock status
  getStockStatus(stock: number): "normal" | "low" | "critical" {
    if (stock === 0) return "critical"
    if (stock <= this.STOCK_THRESHOLD) return "low"
    return "normal"
  }
}

// Export singleton instance
export const lowStockMonitor = LowStockMonitoringService.getInstance()
