import { Button } from "@/components/ui/button"

interface WelcomePageProps {
  onStartTour: () => void
}

export default function WelcomePage({ onStartTour }: WelcomePageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="max-w-7xl w-full flex items-center gap-20">
        {/* Left side - Illustration */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-[500px] h-[500px] rounded-full overflow-hidden">
            <img
              src="/login-image-6.png"
              alt="Welcome illustration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="flex-1 max-w-lg space-y-8">
          {/* User icon image */}
          <div className="flex justify-start">
            <img
              src="/login-image-7.png"
              alt="User icon"
              className="w-16 h-16 rounded-full"
            />
          </div>

          {/* Main heading */}
          <h1 className="text-5xl font-bold text-foreground leading-tight">
            Welcome aboard,
            <br />
            Pioneer!
          </h1>

          {/* Description text */}
          {/* Increased text size from default to text-lg */}
          <div className="space-y-5 text-muted-foreground leading-relaxed text-lg">
            <p>
              Since you're the first one here, your mission is to{" "}
              <span className="font-semibold text-foreground">bring your teammates on board</span> this adventure.
            </p>
            <p>But before that, let me give you a quick little tour so you can get comfy. It'll only take a minute!</p>
          </div>

          {/* Start Tour button */}
          <div className="pt-6 flex justify-end">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg flex items-center gap-3" onClick={onStartTour}>
              Start Tour
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}