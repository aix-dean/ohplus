import { redirect } from "next/navigation"

export default function ContentPageRedirect() {
  // Redirect old content page to new dashboard
  redirect("/cms/dashboard")
}
