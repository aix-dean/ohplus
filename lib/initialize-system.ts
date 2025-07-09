import { initializePredefinedRoles, initializeDefaultPermissions } from "./access-management-service"

export async function initializeSystem() {
  try {
    await initializeDefaultPermissions()
    await initializePredefinedRoles()
    console.log("System initialized successfully")
  } catch (error) {
    console.error("Error initializing system:", error)
  }
}
