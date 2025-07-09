import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { notFound } from "next/navigation"
import LoopTimeline from "@/components/loop-timeline"
import { Clock } from "lucide-react"

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

  const product = await {
    id: "1",
    name: "Product 1",
    description: "This is product 1",
    cms: [
      {
        time: "0:00",
        text: "Start",
      },
      {
        time: "0:05",
        text: "Middle",
      },
      {
        time: "0:10",
        text: "End",
      },
    ],
  }

  if (!product) {
    notFound()
  }

  return (
    <Tabs defaultValue="details" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="loopTimeline">Loop Timeline</TabsTrigger>
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
      <TabsContent value="loopTimeline">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={18} />
              Loop Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {product.cms ? <LoopTimeline cmsData={product.cms} /> : <p>No CMS data available for this product.</p>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
