import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ServiceCost {
  crewFee: string;
  overtimeFee: string;
  transpo: string;
  tollFee: string;
  mealAllowance: string;
  otherFees: { name: string; amount: string }[];
  total: number;
}

interface ServiceExpenseCardProps {
  serviceCost: ServiceCost;
  handleServiceCostChange: (field: string, value: string) => void;
  addOtherFee: () => void;
  removeOtherFee: (index: number) => void;
  updateOtherFee: (index: number, field: "name" | "amount", value: string) => void;
  calculateServiceCostTotal: () => number;
}

export function ServiceExpenseCard({
  serviceCost,
  handleServiceCostChange,
  addOtherFee,
  removeOtherFee,
  updateOtherFee,
  calculateServiceCostTotal,
}: ServiceExpenseCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SERVICE EXPENSE (Optional)</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="crewFee">Crew Fee</Label>
            <Input
              id="crewFee"
              placeholder="Enter amount"
              value={serviceCost.crewFee}
              onChange={(e) => handleServiceCostChange("crewFee", e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="overtimeFee">Overtime Fee</Label>
            <Input
              id="overtimeFee"
              placeholder="Enter amount"
              value={serviceCost.overtimeFee}
              onChange={(e) => handleServiceCostChange("overtimeFee", e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="transpo">Transpo</Label>
            <Input
              id="transpo"
              placeholder="Enter amount"
              value={serviceCost.transpo}
              onChange={(e) => handleServiceCostChange("transpo", e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="tollFee">Toll Fee</Label>
            <Input
              id="tollFee"
              placeholder="Enter amount"
              value={serviceCost.tollFee}
              onChange={(e) => handleServiceCostChange("tollFee", e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="mealAllowance">Meal Allowance</Label>
            <Input
              id="mealAllowance"
              placeholder="Enter amount"
              value={serviceCost.mealAllowance}
              onChange={(e) => handleServiceCostChange("mealAllowance", e.target.value)}
            />
          </div>
          <Button variant="ghost" size="sm" className="mt-7">X</Button>
        </div>

        {serviceCost.otherFees.map((fee, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                placeholder="Other fee name"
                value={fee.name}
                onChange={(e) => updateOtherFee(index, "name", e.target.value)}
              />
              <Input
                placeholder="Amount"
                value={fee.amount}
                onChange={(e) => updateOtherFee(index, "amount", e.target.value)}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeOtherFee(index)}>X</Button>
          </div>
        ))}

        <Button variant="outline" className="w-full" onClick={addOtherFee}>+ Other</Button>

        <div className="flex justify-between items-center mt-4">
          <span className="text-lg font-bold">Total: P {calculateServiceCostTotal().toFixed(2)}</span>
          <span className="text-sm text-gray-500">You can edit this later on!</span>
        </div>
      </CardContent>
    </Card>
  );
}