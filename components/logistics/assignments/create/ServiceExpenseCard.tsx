import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function ServiceExpenseCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SERVICE EXPENSE (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="crewFee">Crew Fee</Label>
            <Input id="crewFee" placeholder="Enter amount" defaultValue="500.00" />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="overtimeFee">Overtime Fee</Label>
            <Input id="overtimeFee" placeholder="Enter amount" defaultValue="150.00" />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="transpo">Transpo</Label>
            <Input id="transpo" placeholder="Enter amount" defaultValue="200.00" />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="tollFee">Toll Fee</Label>
            <Input id="tollFee" placeholder="Enter amount" defaultValue="50.00" />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="mealAllowance">Meal Allowance</Label>
            <Input id="mealAllowance" placeholder="Enter amount" defaultValue="100.00" />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <Button variant="outline" className="w-full">+ Other</Button>

        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold">Total: P 1000.00</span>
          <span className="text-sm text-gray-500">You can edit this later on!</span>
        </div>
      </CardContent>
    </Card>
  );
}