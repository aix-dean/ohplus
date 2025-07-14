import { redirect } from "next/navigation"

interface CMSContentDetailPageProps {
  params: {
    id: string
  }
}

export default function CMSContentDetailPage({ params }: CMSContentDetailPageProps) {
  redirect(`/cms/details/${params.id}`)
}
