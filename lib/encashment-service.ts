import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface PettyCashSettings {
  id?: string
  companyName: string
  pettyCashFundReplenishment: string
  cutOffPeriod: string
  pettyCashFundName: string
  pettyCashFundAmount: number
  created?: Timestamp
  updated?: Timestamp
}

export interface PettyCashRow {
  id?: string
  category: string
  month: string
  date: string
  pettyCashVoucherNo: string
  supplierName: string
  description: string
  accountTitle: string
  documentTypeNo: string
  tinNo: string
  companyAddress: string
  grossAmount: number
  netOfVat: number
  inputVat: number
  onePercent: number
  twoPercent: number
  netAmount: number
  created?: Timestamp
  updated?: Timestamp
}

export async function createPettyCashSettings(
  settings: Omit<PettyCashSettings, "id" | "created" | "updated">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "encashment_settings"), {
      ...settings,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating petty cash settings:", error)
    throw error
  }
}

export async function getPettyCashSettings(): Promise<PettyCashSettings[]> {
  try {
    const q = query(collection(db, "encashment_settings"), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const settings: PettyCashSettings[] = []
    querySnapshot.forEach((doc) => {
      settings.push({ id: doc.id, ...doc.data() } as PettyCashSettings)
    })

    return settings
  } catch (error) {
    console.error("Error fetching petty cash settings:", error)
    return []
  }
}

export async function updatePettyCashSettings(id: string, settings: Partial<PettyCashSettings>): Promise<void> {
  try {
    const settingsRef = doc(db, "encashment_settings", id)
    await updateDoc(settingsRef, {
      ...settings,
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating petty cash settings:", error)
    throw error
  }
}

export async function deletePettyCashSettings(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "encashment_settings", id))
  } catch (error) {
    console.error("Error deleting petty cash settings:", error)
    throw error
  }
}

export async function createPettyCashTransaction(
  transaction: Omit<PettyCashRow, "id" | "created" | "updated">,
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, "encashment_transactions"), {
      ...transaction,
      created: serverTimestamp(),
      updated: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error creating petty cash transaction:", error)
    throw error
  }
}

export async function getPettyCashTransactions(): Promise<PettyCashRow[]> {
  try {
    const q = query(collection(db, "encashment_transactions"), orderBy("created", "desc"))
    const querySnapshot = await getDocs(q)

    const transactions: PettyCashRow[] = []
    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as PettyCashRow)
    })

    return transactions
  } catch (error) {
    console.error("Error fetching petty cash transactions:", error)
    return []
  }
}

export async function updatePettyCashTransaction(id: string, transaction: Partial<PettyCashRow>): Promise<void> {
  try {
    const transactionRef = doc(db, "encashment_transactions", id)
    await updateDoc(transactionRef, {
      ...transaction,
      updated: serverTimestamp(),
    })
  } catch (error) {
    console.error("Error updating petty cash transaction:", error)
    throw error
  }
}

export async function deletePettyCashTransaction(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "encashment_transactions", id))
  } catch (error) {
    console.error("Error deleting petty cash transaction:", error)
    throw error
  }
}

export async function createMultiplePettyCashTransactions(
  transactions: Omit<PettyCashRow, "id" | "created" | "updated">[],
): Promise<string[]> {
  try {
    const promises = transactions.map((transaction) =>
      addDoc(collection(db, "encashment_transactions"), {
        ...transaction,
        created: serverTimestamp(),
        updated: serverTimestamp(),
      }),
    )

    const results = await Promise.all(promises)
    return results.map((docRef) => docRef.id)
  } catch (error) {
    console.error("Error creating multiple petty cash transactions:", error)
    throw error
  }
}

export async function deleteMultiplePettyCashTransactions(ids: string[]): Promise<void> {
  try {
    const promises = ids.map((id) => deleteDoc(doc(db, "encashment_transactions", id)))
    await Promise.all(promises)
  } catch (error) {
    console.error("Error deleting multiple petty cash transactions:", error)
    throw error
  }
}

export const encashmentService = {
  // Settings operations
  createPettyCashSettings,
  getPettyCashSettings,
  updatePettyCashSettings,
  deletePettyCashSettings,

  // Transaction operations
  createPettyCashTransaction,
  getPettyCashTransactions,
  updatePettyCashTransaction,
  deletePettyCashTransaction,
  createMultiplePettyCashTransactions,
  deleteMultiplePettyCashTransactions,
}
