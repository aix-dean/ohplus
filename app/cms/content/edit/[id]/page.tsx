import { redirect } from "next/navigation"

interface CMSContentEditPageProps {
  params: {
    id: string
  }
}

export default function CMSContentEditPage({ params }: CMSContentEditPageProps) {
  redirect(`/cms/details/${params.id}`)
}
