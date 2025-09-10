import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore"; // Import Firestore functions
import { db } from "@/lib/firebase"; // Import db
import { format } from "date-fns"; // Import format

// Define a type for the Job Order data
interface JobOrder {
  id: string;
  joNumber: string; // Changed from jo_number
  joType: string; // Changed from jo_type
  campaign_name: string;
  deadline: string;
  material_specs: string;
  attachment_url: string; // This will be derived from attachments array
  remarks: string;
  requestedBy: { name: string }; // Changed from requested_by
  created: Date;
}

// New component for displaying Job Order details
function JobOrderDetailsCard({ jobOrder, onHide }: { jobOrder: JobOrder; onHide: () => void }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="text-2xl font-bold">JOB ORDER</span>
          <Button variant="ghost" size="sm" onClick={onHide}>
            <X className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-between items-center">
          <p className="text-blue-600 font-medium">JO#: {jobOrder.joNumber}</p>
          <p className="text-sm text-gray-500">{jobOrder.created && !isNaN(jobOrder.created.getTime()) ? format(jobOrder.created, "MMM d, yyyy") : "N/A"}</p>
        </div>
        <div className="space-y-2">
          <Label>JO Type:</Label>
          <p className="font-medium">{jobOrder.joType}</p>
        </div>
        <div className="space-y-2">
          <Label>Campaign Name:</Label>
          <p className="font-medium">{jobOrder.campaign_name}</p>
        </div>
        <div className="space-y-2">
          <Label>Deadline:</Label>
          <p className="font-medium">{jobOrder.deadline}</p>
        </div>
        <div className="space-y-2">
          <Label>Material Specs:</Label>
          <p className="font-medium">{jobOrder.material_specs}</p>
        </div>
        <div className="space-y-2">
          <Label>Attachment:</Label>
          {jobOrder.attachment_url && (
            <img src={jobOrder.attachment_url} alt="Attachment" className="rounded-md h-32 w-32 object-cover" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Remarks:</Label>
          <p className="font-medium">{jobOrder.remarks}</p>
        </div>
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Label>Requested by:</Label>
            <p className="font-medium">{jobOrder.requestedBy.name}</p>
          </div>
          <Button variant="link" size="sm">Change</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceAssignmentCard({ companyId, productId }: { companyId: string | null; productId: string }) {
  const [showJobOrderDetails, setShowJobOrderDetails] = useState(false); // State to manage JobOrderDetailsCard visibility
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null); // State to hold selected job order data

  const handleIdentifyJOClick = async () => {
    try {
      const jobOrdersRef = collection(db, "job_orders");
      const q = query(jobOrdersRef, orderBy("created", "desc"), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const jobOrderData = doc.data();
        const fetchedJobOrder: JobOrder = {
          id: doc.id,
          joNumber: jobOrderData.joNumber || "N/A",
          joType: jobOrderData.joType || "N/A",
          campaign_name: jobOrderData.campaign_name || "N/A",
          deadline: jobOrderData.deadline ? format(new Date(jobOrderData.deadline), "MMM d, yyyy") : "N/A",
          material_specs: jobOrderData.material_specs || "N/A",
          attachment_url: jobOrderData.attachments && jobOrderData.attachments.length > 0 ? jobOrderData.attachments[0].url : "https://via.placeholder.com/150",
          remarks: jobOrderData.remarks || "N/A",
          requestedBy: { name: jobOrderData.requestedBy?.name || "N/A" },
          created: jobOrderData.created ? new Date(jobOrderData.created) : new Date(),
        };
        setSelectedJobOrder(fetchedJobOrder);
        setShowJobOrderDetails(true);
      } else {
        alert("No job orders found.");
      }
    } catch (error) {
      console.error("Error fetching job order:", error);
      alert("Error fetching job order. Please try again.");
    }
  };

  const handleHideJobOrderDetails = () => {
    setShowJobOrderDetails(false);
    setSelectedJobOrder(null);
  };

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
              <Select>
                <SelectTrigger id="materialSpecs">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="perforated_sticker">Perforated Sticker</SelectItem>
                  <SelectItem value="tarpaulin">Tarpaulin</SelectItem>
                  <SelectItem value="acrylic">Acrylic</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Logistics</Label>
              <p className="font-medium">May Tuyan</p>
            </div>
          </CardContent>
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-1/2">
          {!showJobOrderDetails && (
            <div className="flex justify-center items-center h-full">
              <Button variant="outline" className="bg-white text-gray-700 border-gray-300" onClick={handleIdentifyJOClick}>
                <Search className="h-4 w-4 mr-2" />
                Identify JO
              </Button>
            </div>
          )}
          {showJobOrderDetails && selectedJobOrder && (
            <JobOrderDetailsCard jobOrder={selectedJobOrder} onHide={handleHideJobOrderDetails} />
          )}
        </div>
      </div>
    </Card>
  );
}