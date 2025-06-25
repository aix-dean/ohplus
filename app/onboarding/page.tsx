"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Upload, LayoutGrid } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import Image from "next/image"

// Onboarding Header Component
function OnboardingHeader() {
  const router = useRouter()
  return (
    <header className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center">
        <Image src="/oh-plus-logo.png" alt="OHPlus Logo" width={100} height={30} />
      </div>
      <Button variant="outline" onClick={() => router.push("/login")}>
        Exit
      </Button>
    </header>
  )
}

// Onboarding Footer Component
function OnboardingFooter({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onFinish,
  isLastStep,
}: {
  currentStep: number
  totalSteps: number
  onBack: () => void
  onNext: () => void
  onFinish: () => void
  isLastStep: boolean
}) {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-6 flex items-center justify-between">
      <Button variant="ghost" onClick={onBack} disabled={currentStep === 0}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      {isLastStep ? (
        <Button onClick={onFinish}>
          Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={onNext}>
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </footer>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userData, loading, updateUserData } = useAuth()

  // Step 0 is the overview page, actual steps start from 1
  const totalContentSteps = 3 // Welcome, Upload Product, All Set
  const currentStep = Number.parseInt(searchParams.get("step") || "0") // Default to 0 for overview

  useEffect(() => {
    if (!loading && !userData) {
      router.push("/login") // Redirect to login if not authenticated
    }
  }, [userData, loading, router])

  const handleNext = () => {
    if (currentStep < totalContentSteps) {
      router.push(`/onboarding?step=${currentStep + 1}`)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      router.push(`/onboarding?step=${currentStep - 1}`)
    } else {
      // If on overview (step 0) and pressing back, go to subscription selection
      router.push("/register/select-subscription")
    }
  }

  const handleFinishOnboarding = async (redirectPath: string) => {
    if (userData) {
      await updateUserData({ onboarding: false }) // Mark onboarding as complete
    }
    router.push(redirectPath)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
        <p>Loading...</p>
      </div>
    )
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Overview Page
        return (
          <div className="flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-160px)] p-8">
            <div className="md:w-1/2 text-center md:text-left mb-8 md:mb-0">
              <h1 className="text-5xl font-bold mb-6">It's easy to get started on Your App</h1>
            </div>
            <div className="md:w-1/2 space-y-8">
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">1</span>
                <div>
                  <h2 className="text-2xl font-semibold">Tell us about your business</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Share some basic info, like your company name and industry.
                  </p>
                </div>
                <Image
                  src="/placeholder.svg?height=100&width=100"
                  alt="Business Info"
                  width={100}
                  height={100}
                  className="ml-auto"
                />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">2</span>
                <div>
                  <h2 className="text-2xl font-semibold">Upload your first product</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Add details and images for your first product or service.
                  </p>
                </div>
                <Image
                  src="/placeholder.svg?height=100&width=100"
                  alt="Product Upload"
                  width={100}
                  height={100}
                  className="ml-auto"
                />
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-primary">3</span>
                <div>
                  <h2 className="text-2xl font-semibold">Finish setup and explore</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Complete your profile and start using all features.
                  </p>
                </div>
                <Image
                  src="/placeholder.svg?height=100&width=100"
                  alt="Finish Setup"
                  width={100}
                  height={100}
                  className="ml-auto"
                />
              </div>
            </div>
          </div>
        )
      case 1: // Welcome/Introduction
        return (
          <div className="flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-160px)] p-8">
            <div className="md:w-1/2 text-center md:text-left space-y-6">
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">Step 1</p>
              <h1 className="text-5xl font-bold">
                Welcome, {userData?.first_name || "New User"}! {/* Changed to first_name */}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Thank you for registering with us. We're excited to have you on board and help you streamline your
                business operations.
              </p>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0">
              <Image src="/placeholder.svg?height=300&width=400" alt="Welcome" width={400} height={300} />
            </div>
          </div>
        )
      case 2: // Upload Product
        return (
          <div className="flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-160px)] p-8">
            <div className="md:w-1/2 text-center md:text-left space-y-6">
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">Step 2</p>
              <h1 className="text-5xl font-bold">Upload Your First Product</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Let's get you started by adding your first product or service. This will be the foundation for your
                proposals and cost estimates.
              </p>
              <Button onClick={() => handleFinishOnboarding("/admin/inventory")} className="w-full md:w-auto">
                <Upload className="mr-2 h-5 w-5" />
                Upload Product Now
              </Button>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0">
              <Image src="/placeholder.svg?height=300&width=400" alt="Upload Product" width={400} height={300} />
            </div>
          </div>
        )
      case 3: // You're All Set
        return (
          <div className="flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-160px)] p-8">
            <div className="md:w-1/2 text-center md:text-left space-y-6">
              <p className="text-xl font-semibold text-gray-600 dark:text-gray-400">Step 3</p>
              <h1 className="text-5xl font-bold">You're All Set!</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Congratulations! You've completed the initial setup. You're now ready to explore your dashboard and
                start managing your business efficiently.
              </p>
              <Button onClick={() => handleFinishOnboarding("/sales/dashboard")} className="w-full md:w-auto">
                <LayoutGrid className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
            </div>
            <div className="md:w-1/2 flex justify-center md:justify-end mt-8 md:mt-0">
              <Image src="/placeholder.svg?height=300&width=400" alt="All Set" width={400} height={300} />
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <OnboardingHeader />
      <main className="flex-grow">{renderStepContent()}</main>
      <OnboardingFooter
        currentStep={currentStep}
        totalSteps={totalContentSteps}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={() => handleFinishOnboarding("/sales/dashboard")}
        isLastStep={currentStep === totalContentSteps}
      />
    </div>
  )
}
