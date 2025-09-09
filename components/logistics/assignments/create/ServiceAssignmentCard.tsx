import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { JobOrderCard } from './JobOrderCard';

export function ServiceAssignmentCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between items-center bg-gray-100 p-2 rounded-md">
            <div className="flex flex-col">
              <span className="text-xl font-bold">NAN20011</span>
              <span className="text-base text-gray-500">Petplans NB</span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex flex-col gap-4 w-full lg:w-1/2">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col text-sm">
              <p>SA#: 00814</p>
              <p>JO#: 00372</p>
            </div>
            <p className="text-sm">Sep 5, 2025</p>
          </div>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceType">Service Type</Label>
                <Select>
                  <SelectTrigger id="serviceType">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">Installation</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name</Label>
                <Input id="campaignName" placeholder="Enter campaign name" defaultValue="Petplans NB Campaign" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="serviceStartDate">Service Start Date</Label>
                <div className="relative">
                  <Input id="serviceStartDate" type="text" placeholder="-Choose Date-" defaultValue="Sep 5, 2025" className="pr-8" />
                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceEndDate">Service End Date</Label>
                <div className="relative">
                  <Input id="serviceEndDate" type="text" placeholder="-Choose Date-" defaultValue="Sep 5, 2025" className="pr-8" />
                  <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceDuration">Service Duration</Label>
              <Input id="serviceDuration" placeholder="Enter service duration" defaultValue="1 Day" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materialSpecs">Material Specs</Label>
              <p className="font-medium">Perforated Sticker</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="attachment">Attachment</Label>
              <img src="https://via.placeholder.com/150" alt="Attachment" className="rounded-md h-32 w-32 object-cover" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Input id="remarks" placeholder="Add any remarks here" defaultValue="Client requested early morning service." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crew">Crew</Label>
              <Select>
                <SelectTrigger id="crew">
                  <SelectValue placeholder="Choose a Crew" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crew1">Crew Alpha</SelectItem>
                  <SelectItem value="crew2">Crew Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Illumination/Nits</Label>
              <p className="font-medium">10PCS of 1000W metal halide</p>
            </div>

            <div className="space-y-2">
              <Label>Gondola</Label>
              <p className="font-medium">YES</p>
            </div>

            <div className="space-y-2">
              <Label>Sales</Label>
              <p className="font-medium">Noemi Abellanada</p>
            </div>

            <div className="space-y-2">
              <Label>Logistics</Label>
              <p className="font-medium">May Tuyan</p>
            </div>
          </CardContent>
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-1/2">
          <JobOrderCard />
        </div>
      </div>
    </Card>
  );
}