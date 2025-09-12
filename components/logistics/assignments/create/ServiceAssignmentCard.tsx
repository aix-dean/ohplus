import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore"; // Import Firestore functions
import { db } from "@/lib/firebase"; // Import db
import { format } from "date-fns"; // Import format
import type { Timestamp } from "firebase/firestore"; // Import Timestamp type

// Import the proper JobOrder type
import type { JobOrder } from "@/lib/types/job-order";
import type { Product } from "@/lib/firebase-service";
import type { Team } from "@/lib/types/team";
import { useToast } from "@/hooks/use-toast";
import { JobOrderSelectionDialog } from './JobOrderSelectionDialog';

// New component for displaying Job Order details JO#:
function JobOrderDetailsCard({ jobOrder, onHide }: { jobOrder: JobOrder; onHide: () => void }) {
  // Helper function to format date
  const formatDate = (date: string | Date | Timestamp | undefined) => {
    if (!date) return "N/A";
    try {
      const dateObj = date instanceof Date ? date : typeof date === 'string' ? new Date(date) : date.toDate();
      return format(dateObj, "MMM d, yyyy");
    } catch (error) {
      return "N/A";
    }
  };

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
          <p className="text-sm text-gray-500">{formatDate(jobOrder.created)}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">JO Type:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.joType}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Site Name:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.siteName}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Deadline:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{formatDate(jobOrder.deadline)}</p>
        </div>
        <div className="space-y-2">
          <Label>Attachments:</Label>
          {jobOrder.siteImageUrl ? (
            <img
              src={jobOrder.siteImageUrl}
              alt="Site Image"
              className="rounded-md h-32 w-32 object-cover"
            />
          ) : jobOrder.attachments && jobOrder.attachments.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {jobOrder.attachments.slice(0, 4).map((attachment, index) => (
                <img
                  key={index}
                  src={attachment.url}
                  alt={attachment.name}
                  className="rounded-md h-16 w-16 object-cover"
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No attachments</p>
          )}
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Remarks:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.remarks || "N/A"}</p>
        </div>
        <div className="flex items-center">
          <Label className="w-1/2">Requested by:</Label>
          <p className="w-1/2 font-medium m-0 p-0">{jobOrder.requestedBy}</p>
        </div>
        <div className="flex justify-end">
          <Button variant="link" size="sm">Change</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FormData {
  projectSite: string;
  serviceType: string;
  assignedTo: string;
  serviceDuration: string;
  priority: string;
  equipmentRequired: string;
  materialSpecs: string;
  crew: string;
  illuminationNits: string;
  gondola: string;
  technology: string;
  sales: string;
  remarks: string;
  message: string;
  startDate: Date | null;
  endDate: Date | null;
  alarmDate: Date | null;
  alarmTime: string;
  attachments: { name: string; type: string; file?: File }[];
  serviceCost: {
    crewFee: string;
    overtimeFee: string;
    transpo: string;
    tollFee: string;
    mealAllowance: string;
    otherFees: { name: string; amount: string }[];
    total: number;
  };
}

interface ServiceAssignmentCardProps {
  companyId: string | null;
  productId: string;
  formData: FormData;
  handleInputChange: (field: string, value: any) => void;
  handleDateInputChange: (type: "start" | "end" | "alarm", value: string) => void;
  products: Product[];
  teams: Team[];
  saNumber: string;
  startDateInput: string;
  endDateInput: string;
  alarmDateInput: string;
  jobOrderData: JobOrder | null;
}

export function ServiceAssignmentCard({
  companyId,
  productId,
  formData,
  handleInputChange,
  handleDateInputChange,
  products,
  teams,
  saNumber,
  startDateInput,
  endDateInput,
  alarmDateInput,
  jobOrderData,
  onOpenProductSelection
}: ServiceAssignmentCardProps & { onOpenProductSelection: () => void }) {
  const [showJobOrderDetails, setShowJobOrderDetails] = useState(false); // State to manage JobOrderDetailsCard visibility
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(jobOrderData); // State to hold selected job order data
  const [currentTime, setCurrentTime] = useState(""); // State for current time display
  const [showJobOrderSelectionDialog, setShowJobOrderSelectionDialog] = useState(false); // State for JobOrderSelectionDialog
  const { toast } = useToast(); // Use the toast hook

  // Set current time on component mount
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }));
  }, []);

  const handleIdentifyJOClick = () => {
    // Check if a product is selected
    if (!productId) {
      // Show error toast
      toast({
        title: "Site Selection Required",
        description: "Please select a site first before identifying job orders.",
        variant: "destructive",
      });
      return;
    }

    // Show the job order selection dialog
    setShowJobOrderSelectionDialog(true);
  };

  const handleJobOrderSelect = (jobOrder: JobOrder) => {
    // Set the selected job order and show the details
    setSelectedJobOrder(jobOrder);
    setShowJobOrderDetails(true);
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
              <span className="text-xl font-bold">
                {products.find(p => p.id === productId)?.site_code || "Site Code"}
              </span>
              <span className="text-base text-gray-500">
                {products.find(p => p.id === productId)?.name || "Select Project Site"}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenProductSelection}
              className="ml-4"
            >
              {productId ? "Change Site" : "Select Site"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex flex-col gap-4 w-full lg:w-1/2">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col text-sm">
              <p>SA#: {saNumber}</p>
              <p className="text-xs text-gray-500">
                {products.find(p => p.id === productId)?.site_code || "Site Code"}
              </p>
            </div>
            <p className="text-sm">{currentTime}</p>
          </div>
          <CardContent className="grid gap-4">
            {/* Service Type - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceType" className="w-32 flex-shrink-0">Service Type:</Label>
              <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
                <SelectTrigger id="serviceType" className="flex-1">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Roll Up">Roll Up</SelectItem>
                  <SelectItem value="Roll Down">Roll Down</SelectItem>
                  <SelectItem value="Monitoring">Monitoring</SelectItem>
                  <SelectItem value="Change Material">Change Material</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Name - Row Layout */}
            {formData.serviceType !== "Maintenance" && (
              <div className="flex items-center space-x-4">
                <Label htmlFor="campaignName" className="w-32 flex-shrink-0">Campaign Name:</Label>
                <Input
                  id="campaignName"
                  placeholder="Enter campaign name"
                  value={formData.message || ""}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  className="flex-1"
                />
              </div>
            )}

            {/* Service Start Date - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceStartDate" className="w-32 flex-shrink-0">
                {["Monitoring", "Maintenance"].includes(formData.serviceType) ? "Service Date:" : "Service Start Date:"}
              </Label>
              <div className="relative flex-1">
                <Input
                  id="serviceStartDate"
                  type="text"
                  placeholder="-Choose Date-"
                  value={startDateInput}
                  onChange={(e) => handleDateInputChange("start", e.target.value)}
                  className="pr-8"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Service End Date - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceEndDate" className="w-32 flex-shrink-0">Service End Date:</Label>
              <div className="relative flex-1">
                <Input
                  id="serviceEndDate"
                  type="text"
                  placeholder="-Choose Date-"
                  value={endDateInput}
                  onChange={(e) => handleDateInputChange("end", e.target.value)}
                  className="pr-8"
                />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceDuration" className="w-32 flex-shrink-0">Service Duration:</Label>
              <Input
                id="serviceDuration"
                placeholder="Enter service duration"
                value={formData.serviceDuration}
                onChange={(e) => handleInputChange("serviceDuration", e.target.value)}
                className="flex-1"
              />
            </div>

            {!["Monitoring", "Change Material", "Maintenance"].includes(formData.serviceType) && (
              <div className="flex items-center space-x-4">
                <Label htmlFor="materialSpecs" className="w-32 flex-shrink-0">Material Specs:</Label>
                <Select value={formData.materialSpecs} onValueChange={(value) => handleInputChange("materialSpecs", value)}>
                  <SelectTrigger id="materialSpecs" className="flex-1">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="perforated_sticker">Perforated Sticker</SelectItem>
                    <SelectItem value="tarpaulin">Tarpaulin</SelectItem>
                    <SelectItem value="acrylic">Acrylic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-start space-x-4">
              <Label htmlFor="attachment" className="w-32 flex-shrink-0 pt-2">Attachment:</Label>
              <div className="flex-1">
                {formData.serviceType === "Change Material" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Old Material</Label>
                      {selectedJobOrder?.siteImageUrl ? (
                        <img
                          src={selectedJobOrder.siteImageUrl}
                          alt="Old Material"
                          className="rounded-md h-32 w-full object-cover"
                        />
                      ) : (
                        <img src="https://via.placeholder.com/150" alt="Old Material" className="rounded-md h-32 w-full object-cover" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">New Material</Label>
                      <img src="https://via.placeholder.com/150" alt="New Material" className="rounded-md h-32 w-full object-cover" />
                    </div>
                  </div>
                ) : (
                  selectedJobOrder?.siteImageUrl ? (
                    <img
                      src={selectedJobOrder.siteImageUrl}
                      alt="Site Image"
                      className="rounded-md h-32 w-32 object-cover"
                    />
                  ) : (
                    <img src="https://via.placeholder.com/150" alt="Attachment" className="rounded-md h-32 w-32 object-cover" />
                  )
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="remarks" className="w-32 flex-shrink-0">Remarks:</Label>
              <Input
                id="remarks"
                placeholder="Add any remarks here"
                value={formData.remarks}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                className="flex-1"
              />
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="crew" className="w-32 flex-shrink-0">Crew:</Label>
              <Select value={formData.crew} onValueChange={(value) => handleInputChange("crew", value)}>
                <SelectTrigger id="crew" className="flex-1">
                  <SelectValue placeholder="Choose a Crew" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="add-new-team">+ Add New Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!["Monitoring", "Change Material", "Maintenance"].includes(formData.serviceType) && (
              <div className="flex items-center space-x-4">
                <Label className="w-32 flex-shrink-0">Illumination/Nits:</Label>
                <Input
                  placeholder="Enter illumination details"
                  value={formData.illuminationNits}
                  onChange={(e) => handleInputChange("illuminationNits", e.target.value)}
                  className="flex-1"
                />
              </div>
            )}

            {!["Monitoring", "Maintenance"].includes(formData.serviceType) && (
              <div className="flex items-center space-x-4">
                <Label className="w-32 flex-shrink-0">Gondola:</Label>
                <Input
                  placeholder="Enter gondola details"
                  value={formData.gondola}
                  onChange={(e) => handleInputChange("gondola", e.target.value)}
                  className="flex-1"
                />
              </div>
            )}

            {!["Monitoring", "Maintenance"].includes(formData.serviceType) && (
              <div className="flex items-center space-x-4">
                <Label className="w-32 flex-shrink-0">Logistics:</Label>
                <Input
                  placeholder="Enter logistics details"
                  value={formData.sales}
                  onChange={(e) => handleInputChange("sales", e.target.value)}
                  className="flex-1"
                />
              </div>
            )}
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

      {/* Job Order Selection Dialog */}
      <JobOrderSelectionDialog
        open={showJobOrderSelectionDialog}
        onOpenChange={setShowJobOrderSelectionDialog}
        productId={productId}
        companyId={companyId || ""}
        onSelectJobOrder={handleJobOrderSelect}
      />
    </Card>
  );
}