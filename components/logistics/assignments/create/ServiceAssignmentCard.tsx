import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
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
function JobOrderDetailsCard({
  jobOrder,
  onHide,
  onChange
}: {
  jobOrder: JobOrder;
  onHide: () => void;
  onChange: () => void;
}) {
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
          <Button variant="link" size="sm" onClick={onChange}>Change</Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface FormData {
  projectSite: string;
  serviceType: string;
  assignedTo: string;
  serviceDuration: number;
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
  products: Product[];
  teams: Team[];
  saNumber: string;
  jobOrderData: JobOrder | null;
  onOpenProductSelection: () => void;
}

export function ServiceAssignmentCard({
  companyId,
  productId,
  formData,
  handleInputChange,
  products,
  teams,
  saNumber,
  jobOrderData,
  onOpenProductSelection
}: ServiceAssignmentCardProps) {
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

  // Auto-calculate service duration when dates or service type change
  useEffect(() => {
    const duration = calculateServiceDuration(formData.startDate, formData.endDate, formData.serviceType);
    if (duration && duration !== formData.serviceDuration) {
      handleInputChange("serviceDuration", duration);
    }
  }, [formData.startDate, formData.endDate, formData.serviceType]);

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

  // Helper function to safely parse and validate dates
  const parseDateSafely = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    try {
      let date: Date;

      // Handle different date formats
      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        // Try parsing as ISO string first
        date = new Date(dateValue);
        // If invalid, try other formats
        if (isNaN(date.getTime())) {
          // Try parsing as timestamp (seconds)
          if (!isNaN(Number(dateValue))) {
            date = new Date(Number(dateValue) * 1000);
          } else {
            return null;
          }
        }
      } else if (typeof dateValue === 'number') {
        // Handle timestamp in seconds
        date = new Date(dateValue * 1000);
      } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        // Handle Firestore Timestamp
        date = new Date(dateValue.seconds * 1000);
      } else {
        return null;
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch (error) {
      console.warn('Error parsing date:', dateValue, error);
      return null;
    }
  };

  // Helper function to calculate service duration
  const calculateServiceDuration = (startDate: Date | null, endDate: Date | null, serviceType: string): number => {
    // For monitoring and maintenance, duration is typically 1 day
    if (["Monitoring", "Maintenance"].includes(serviceType)) {
      return 1;
    }

    // If we have both dates, calculate the difference
    if (startDate && endDate) {
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return 1;
      } else {
        return diffDays;
      }
    }

    // If only start date is available, assume 1 day
    if (startDate && !endDate) {
      return 1;
    }

    // Default fallback
    return 0;
  };

  const handleJobOrderSelect = (jobOrder: JobOrder) => {
    // Set the selected job order and show the details
    setSelectedJobOrder(jobOrder);
    setShowJobOrderDetails(true);

    // Auto-fill form fields with job order data
    handleInputChange("serviceType", jobOrder.joType || "");
    handleInputChange("remarks", jobOrder.remarks || "");
    handleInputChange("message", jobOrder.message || "");

    // Set materialSpecs from job order data
    handleInputChange("materialSpecs", jobOrder.materialSpec || "");

    // Set illuminationNits from job order data
    handleInputChange("illuminationNits", jobOrder.illumination || "");

    // Set dates if available and valid
    const requestedDate = parseDateSafely(jobOrder.dateRequested);
    if (requestedDate) {
      handleInputChange("startDate", requestedDate);
    }

    const deadlineDate = parseDateSafely(jobOrder.deadline);
    if (deadlineDate) {
      handleInputChange("endDate", deadlineDate);
    }

    // Auto-calculate service duration based on dates
    const duration = calculateServiceDuration(requestedDate, deadlineDate, jobOrder.joType || "");
    if (duration) {
      handleInputChange("serviceDuration", duration);
    }

    // Set assignedTo if available
    if (jobOrder.assignTo) {
      handleInputChange("assignedTo", jobOrder.assignTo);
    }

    // Set priority based on deadline proximity
    if (deadlineDate) {
      const now = new Date();
      const daysDiff = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        handleInputChange("priority", "High");
      } else if (daysDiff <= 3) {
        handleInputChange("priority", "Medium");
      } else {
        handleInputChange("priority", "Low");
      }
    }
  };

  const handleHideJobOrderDetails = () => {
    setShowJobOrderDetails(false);
    setSelectedJobOrder(null);
  };

  const handleChangeJobOrder = () => {
    // Re-open the job order selection dialog
    setShowJobOrderSelectionDialog(true);
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
              <Label className="w-32 flex-shrink-0">
                {["Monitoring", "Maintenance"].includes(formData.serviceType) ? "Service Date:" : "Service Start Date:"}
              </Label>
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
                        !formData.startDate && "text-gray-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {formData.startDate ? (
                        format(formData.startDate, "PPP")
                      ) : (
                        <span>Choose Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate || undefined}
                      onSelect={(date) => handleInputChange("startDate", date || null)}
                      disabled={{ before: new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Service End Date - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label className="w-32 flex-shrink-0">Service End Date:</Label>
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white text-gray-800 border-gray-300 hover:bg-gray-50",
                        !formData.endDate && "text-gray-500",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                      {formData.endDate ? (
                        format(formData.endDate, "PPP")
                      ) : (
                        <span>Choose Date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate || undefined}
                      onSelect={(date) => handleInputChange("endDate", date || null)}
                      disabled={{ before: new Date() }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceDuration" className="w-32 flex-shrink-0">Service Duration:</Label>
              <div className="flex-1 flex items-center space-x-2">
                <Input
                  id="serviceDuration"
                  type="number"
                  placeholder="0"
                  value={formData.serviceDuration || ""}
                  onChange={(e) => handleInputChange("serviceDuration", parseInt(e.target.value) || 0)}
                  className="flex-1"
                  min="0"
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">days</span>
              </div>
            </div>

            {!["Monitoring", "Change Material", "Maintenance"].includes(formData.serviceType) && (
              <div className="flex items-center space-x-4">
                <Label htmlFor="materialSpecs" className="w-32 flex-shrink-0">Material Specs:</Label>
                <Select value={formData.materialSpecs} onValueChange={(value) => handleInputChange("materialSpecs", value)}>
                  <SelectTrigger id="materialSpecs" className="flex-1">
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tarpaulin">Tarpaulin</SelectItem>
                    <SelectItem value="Sticker">Sticker</SelectItem>
                    <SelectItem value="Digital File">Digital File</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
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
                <Select value={formData.gondola} onValueChange={(value) => handleInputChange("gondola", value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select Yes or No" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
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
            <JobOrderDetailsCard
              jobOrder={selectedJobOrder}
              onHide={handleHideJobOrderDetails}
              onChange={handleChangeJobOrder}
            />
          )}
        </div>
      </div>

      {/* Job Order Selection Dialog */}
      <JobOrderSelectionDialog
        open={showJobOrderSelectionDialog}
        onOpenChange={setShowJobOrderSelectionDialog}
        productId={productId || ""}
        companyId={companyId || ""}
        onSelectJobOrder={handleJobOrderSelect}
      />
    </Card>
  );
}