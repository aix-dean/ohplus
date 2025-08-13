"use client"

import { useState, useEffect } from "react"
import { collection, query, where, onSnapshot, type Unsubscribe } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/contexts/auth-context"

export interface StockItem {
  id: string
  name: string
  stock: number
  category: string
  brand: string
  department: string
  status: "active" | "inactive" | "maintenance" | "retired"
  updated_at: any
}

export function useRealTimeStock() {
  const { userData } = useAuth()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userData?.company_id) {
      setLoading(false)
      return
    }

    let unsubscribe: Unsubscribe | null = null

    const setupRealTimeListener = () => {
      try {
        const itemsRef = collection(db, "itInventory")
        const q = query(
          itemsRef,
          where("company_id", "==", userData.company_id),
          where("deleted", "==", false),
          where("status", "==", "active"),
        )

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const items: StockItem[] = []

            snapshot.forEach((doc) => {
              const data = doc.data()
              items.push({
                id: doc.id,
                name: data.name || "",
                stock: data.stock || 0,
                category: data.category || "",
                brand: data.brand || "",
                department: data.department || "",
                status: data.status || "active",
                updated_at: data.updated_at,
              })
            })

            setStockItems(items)
            setLoading(false)
            setError(null)
          },
          (err) => {
            console.error("Error in real-time stock listener:", err)
            setError("Failed to load real-time stock data")
            setLoading(false)
          },
        )
      } catch (err) {
        console.error("Error setting up real-time stock listener:", err)
        setError("Failed to initialize real-time stock tracking")
        setLoading(false)
      }
    }

    setupRealTimeListener()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userData?.company_id])

  // Get stock for specific item
  const getItemStock = (itemId: string): number => {
    const item = stockItems.find((item) => item.id === itemId)
    return item?.stock || 0
  }

  // Get low stock items
  const getLowStockItems = (): StockItem[] => {
    return stockItems.filter((item) => item.stock <= 3)
  }

  // Get out of stock items
  const getOutOfStockItems = (): StockItem[] => {
    return stockItems.filter((item) => item.stock === 0)
  }

  // Get stock statistics
  const getStockStats = () => {
    const totalItems = stockItems.length
    const lowStockCount = getLowStockItems().length
    const outOfStockCount = getOutOfStockItems().length
    const wellStockedCount = totalItems - lowStockCount

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      wellStockedCount,
      lowStockPercentage: totalItems > 0 ? (lowStockCount / totalItems) * 100 : 0,
    }
  }

  return {
    stockItems,
    loading,
    error,
    getItemStock,
    getLowStockItems,
    getOutOfStockItems,
    getStockStats,
  }
}
