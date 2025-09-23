"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronDown, Building2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { type RoleType } from "@/lib/hardcoded-access-service"
import { cn } from "@/lib/utils"

interface DepartmentOption {
  name: string
  path: string
  role: RoleType
  color: string
}

const departmentMapping: Record<RoleType, DepartmentOption> = {
  admin: {
    name: "Admin",
    path: "/admin/dashboard",
    role: "admin",
    color: "bg-purple-500"
  },
  it: {
    name: "IT",
    path: "/it",
    role: "it",
    color: "bg-teal-500"
  },
  sales: {
    name: "Sales",
    path: "/sales/dashboard",
    role: "sales",
    color: "bg-red-500"
  },
  logistics: {
    name: "Logistics",
    path: "/logistics/dashboard",
    role: "logistics",
    color: "bg-blue-500"
  },
  cms: {
    name: "CMS",
    path: "/cms/dashboard",
    role: "cms",
    color: "bg-orange-500"
  },
  business: {
    name: "Business",
    path: "/business",
    role: "business",
    color: "bg-purple-500"
  },
  treasury: {
    name: "Treasury",
    path: "/treasury",
    role: "treasury",
    color: "bg-green-500"
  },
  accounting: {
    name: "Accounting",
    path: "/accounting",
    role: "accounting",
    color: "bg-blue-500"
  },
  finance: {
    name: "Finance",
    path: "/finance",
    role: "finance",
    color: "bg-emerald-500"
  }
}

export function DepartmentDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { userData } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  if (!userData?.roles || userData.roles.length <= 1) {
    return null // Don't show dropdown if user has only one role or no roles
  }

  // Get accessible departments based on user roles
  const accessibleDepartments = userData.roles
    .map(role => departmentMapping[role])
    .filter(Boolean)

  // Find current department based on pathname
  const currentDepartment = accessibleDepartments.find(dept =>
    pathname.startsWith(`/${dept.role}`)
  ) || accessibleDepartments[0]

  const handleDepartmentSelect = (department: DepartmentOption) => {
    console.log("Department select triggered for:", department.name, "path:", department.path)
    try {
      router.push(department.path)
      console.log("Router.push called successfully")
    } catch (error) {
      console.error("Error in router.push:", error)
    }
    setIsOpen(false)
  }

  const handleButtonClick = () => {
    console.log("Dropdown button clicked, isOpen:", isOpen)
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const newPosition = {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      }
      console.log("Calculated position:", newPosition)
      setDropdownPosition(newPosition)
    }
    setIsOpen(!isOpen)
  }

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
  //       setIsOpen(false)
  //     }
  //   }

  //   if (isOpen) {
  //     document.addEventListener('mousedown', handleClickOutside)
  //   }

  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside)
  //   }
  // }, [isOpen])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
      >
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{currentDepartment.name}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {console.log("Rendering dropdown")}
          {/* Dropdown */}
          <div className="absolute top-full left-0 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] text-gray-900 mt-1">
            <div className="py-1" onClick={() => console.log("Dropdown container clicked")}>
              {accessibleDepartments.map((department) => (
                <button
                  key={department.role}
                  onClick={(e) => {
                    console.log("Dropdown item clicked:", department.name)
                    e.stopPropagation()
                    handleDepartmentSelect(department)
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors flex items-center space-x-3",
                    department.role === currentDepartment.role && "bg-gray-200 font-medium"
                  )}
                >
                  <div className={cn("w-3 h-3 rounded-full", department.color)} />
                  <span>{department.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}