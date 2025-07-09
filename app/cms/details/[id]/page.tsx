import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shell } from "@/components/shell"
import { getCmsData } from "@/lib/cms"
import { notFound } from "next/navigation"
import LoopTimeline from "@/components/loop-timeline"

interface Props {
  params: {
    id: string
  }
}

export default async function Page({ params }: Props) {
  const { id } = params

  if (!id) {
    notFound()
  }

  const product = await getCmsData(id)

  if (!product) {
    notFound()
  }

  return (
    <Shell>
      <Tabs defaultValue="details" className="w-[400px]">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="timeline">Loop Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Information about the selected product.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-2">
                <div>ID:</div>
                <div>{product.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Name:</div>
                <div>{product.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>Description:</div>
                <div>{product.description}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Loop Timeline</CardTitle>
              <CardDescription>Visual representation of the loop timeline with spot durations</CardDescription>
            </CardHeader>
            <CardContent>
              <LoopTimeline cmsData={product.cms_data} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Shell>
  )
}
