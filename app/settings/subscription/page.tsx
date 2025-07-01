"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"
import { getSubscriptionPlans } from "@/lib/subscription-service"
import type { SubscriptionPlan } from "@/lib/types/subscription"
import { useToast } from "@/components/ui/use-toast"

export default function SubscriptionSettingsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchedPlans = getSubscriptionPlans()
    setPlans(fetchedPlans)
    const activePlan = fetchedPlans.find((p) => p.isCurrent)
    if (activePlan) {
      setCurrentPlanId(activePlan.id)
    }
  }, [])

  const handleSelectPlan = (planId: string) => {
    setCurrentPlanId(planId)
    toast({
      title: "Plan Updated!",
      description: `You have successfully selected the ${plans.find((p) => p.id === planId)?.name}.`,
    })
    // In a real application, you would call an API to update the user's subscription
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Subscription Settings</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.id === currentPlanId ? "border-primary ring-2 ring-primary" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {plan.id === currentPlanId && (
                  <Badge className="bg-primary text-primary-foreground">Current Plan</Badge>
                )}
              </CardTitle>
              <CardDescription>{plan.price === 0 ? "Free" : `$${plan.price.toFixed(2)} / month`}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckIcon className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => handleSelectPlan(plan.id)} disabled={plan.id === currentPlanId}>
                {plan.id === currentPlanId ? "Current Plan" : "Select Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </main>
  )
}

// Re-adding Badge component as it was not explicitly included in the previous context
import { cn } from "@/lib/utils"
import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
