"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { PLANS } from "@/config/plans"
import { trpc } from "@/trpc/client"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

const ChoosePlanPage = () => {
  const router = useRouter()
  const { toast } = useToast()
  const { user, refreshUserData } = useAuth()

  const checkoutMutation = trpc.createStripeCheckoutSession.useMutation({
    onSuccess: async (data) => {
      toast({
        title: "Redirecting to checkout...",
        description: "You will be redirected to Stripe to complete your purchase.",
      })

      router.push(data.url)
    },
    onError: (error) => {
      toast({
        title: "Something went wrong",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleCheckout = async (planId: string) => {
    checkoutMutation.mutate({ planId })
  }

  return (
    <div className="container py-12">
      <h1 className="text-3xl font-bold mb-4">Choose a Plan</h1>
      <p className="text-muted-foreground mb-8">Select the plan that best suits your needs.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <h2 className="text-xl font-semibold mb-2">{plan.name}</h2>
            <p className="text-muted-foreground mb-4">{plan.description}</p>
            <p className="text-2xl font-bold mb-4">${plan.price}/month</p>
            <Button onClick={() => handleCheckout(plan.id)}>Choose {plan.name}</Button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChoosePlanPage
