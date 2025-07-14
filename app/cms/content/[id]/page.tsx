import { redirect } from "next/navigation"

interface PageProps {
  params: {
    id: string
  }
}

export default function ContentDetailRedirect({ params }: PageProps) {
  // Redirect old content detail route to new details route
  redirect(`/cms/details/${params.id}`)
}
