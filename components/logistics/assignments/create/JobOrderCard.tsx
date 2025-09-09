import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export function JobOrderCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold">JOB ORDER</span>
          </div>
          <Button variant="ghost" size="sm">X</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>JO#:</Label>
            <p className="font-medium">00372</p>
          </div>
          <div className="space-y-2">
            <Label>Date:</Label>
            <p className="font-medium">Sep 5, 2025</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>JO Type:</Label>
          <p className="font-medium">Roll Up</p>
        </div>

        <div className="space-y-2">
          <Label>Campaign Name:</Label>
          <p className="font-medium">Fantastic 4</p>
        </div>

        <div className="space-y-2">
          <Label>Deadline:</Label>
          <p className="font-medium">Dec 15, 2025</p>
        </div>

        <div className="space-y-2">
          <Label>Material Specs:</Label>
          <p className="font-medium">Perforated Sticker</p>
        </div>

        <div className="space-y-2">
          <Label>Attachment:</Label>
          <img src="https://via.placeholder.com/150" alt="Attachment" className="rounded-md h-32 w-32 object-cover" />
        </div>

        <div className="space-y-2">
          <Label>Remarks:</Label>
          <p className="font-medium">N/A</p>
        </div>

        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Label>Requested by:</Label>
            <p className="font-medium">Noemi Abellanada</p>
          </div>
          <Button variant="link" size="sm">Change</Button>
        </div>
      </CardContent>
    </Card>
  );
}