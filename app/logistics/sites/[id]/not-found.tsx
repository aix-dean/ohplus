import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">404 - Site Not Found</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-muted-foreground">
            The site you are looking for does not exist or you do not have permission to view it.
          </p>
          <Button asChild>
            <Link href="/logistics/dashboard">Go to Logistics Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
