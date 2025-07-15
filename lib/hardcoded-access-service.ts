import type { AccessService } from "./access-service"
import type { Role, User, UserRole } from "./types"
import { serverTimestamp } from "./firebase"

export class HardcodedAccessService implements AccessService {
  private users: User[] = [
    { id: "user1", name: "Alice" },
    { id: "user2", name: "Bob" },
  ]

  private roles: Role[] = [
    { id: "role1", name: "Admin" },
    { id: "role2", name: "Editor" },
  ]

  private userRoles: UserRole[] = []

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find((user) => user.id === id)
  }

  async getRole(id: string): Promise<Role | undefined> {
    return this.roles.find((role) => role.id === id)
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    return this.userRoles.filter((userRole) => userRole.userId === userId)
  }

  async assignRoleToUser(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    const user = await this.getUser(userId)
    const role = await this.getRole(roleId)

    if (!user || !role) {
      throw new Error("User or role not found")
    }

    const userRole: UserRole = {
      userId,
      roleId,
      assignedAt: serverTimestamp(),
      isActive: true,
      ...(assignedBy && { assignedBy }),
    }

    this.userRoles.push(userRole)
  }

  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    this.userRoles = this.userRoles.filter((userRole) => !(userRole.userId === userId && userRole.roleId === roleId))
  }

  async isUserInRole(userId: string, roleId: string): Promise<boolean> {
    return this.userRoles.some(
      (userRole) => userRole.userId === userId && userRole.roleId === roleId && userRole.isActive,
    )
  }
}
