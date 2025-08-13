"use client"

import { Package, Wrench, Package2, ChevronRight } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

const SideNavigation = () => {
  const pathname = usePathname()
  const router = useRouter()
  const isExpanded = true // Assuming this is how you determine if the section is expanded

  return (
    <nav>
      <div className="space-y-4">
        {/* IT Section */}
        <div className="space-y-1">
          {isExpanded && (
            <div className="space-y-1">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-9 text-sm font-normal px-3",
                      "hover:bg-slate-100 hover:text-slate-900",
                      "group",
                    )}
                  >
                    <Package className="mr-3 h-4 w-4 shrink-0" />
                    <span className="truncate">Inventory</span>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-90" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 pl-6">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 text-xs font-normal px-3",
                      pathname === "/it/inventory/assets" && "bg-slate-100 text-slate-900",
                      "hover:bg-slate-50 hover:text-slate-900",
                    )}
                    onClick={() => router.push("/it/inventory/assets")}
                  >
                    <HardDrive className="mr-2 h-3 w-3 shrink-0" />
                    <span className="truncate">Assets</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 text-xs font-normal px-3",
                      pathname === "/it/inventory/tools" && "bg-slate-100 text-slate-900",
                      "hover:bg-slate-50 hover:text-slate-900",
                    )}
                    onClick={() => router.push("/it/inventory/tools")}
                  >
                    <Wrench className="mr-2 h-3 w-3 shrink-0" />
                    <span className="truncate">Tools</span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-8 text-xs font-normal px-3",
                      pathname === "/it/inventory/consumables" && "bg-slate-100 text-slate-900",
                      "hover:bg-slate-50 hover:text-slate-900",
                    )}
                    onClick={() => router.push("/it/inventory/consumables")}
                  >
                    <Package2 className="mr-2 h-3 w-3 shrink-0" />
                    <span className="truncate">Consumables</span>
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
          {/* Other IT menu items */}
        </div>
        {/* Other sections */}
      </div>
    </nav>
  )
}

export default SideNavigation
