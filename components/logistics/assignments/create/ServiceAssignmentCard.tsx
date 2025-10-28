import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon, Search, X, ArrowRight } from 'lucide-react';
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

/*
// New component for displaying Job Order details JO#: change
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
          <span className="text-2xl font-bold">JOB ORDERs</span>
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
*/

interface FormData {
  projectSite: string;
  serviceType: string;
  assignedTo: string;
  serviceDuration: number;
  priority: string;
  equipmentRequired: string;
  materialSpecs: string;
  crew: string;
  gondola: string;
  technology: string;
  sales: string;
  remarks: string;
  message: string;
  campaignName?: string;
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
  onClearJobOrder?: () => void;
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
  onOpenProductSelection,
  onClearJobOrder
}: ServiceAssignmentCardProps) {
  const [showJobOrderDetails, setShowJobOrderDetails] = useState(false); // State to manage JobOrderDetailsCard visibility
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(jobOrderData); // State to hold selected job order data
  const [currentTime, setCurrentTime] = useState(""); // State for current time display
  const [showJobOrderSelectionDialog, setShowJobOrderSelectionDialog] = useState(false); // State for JobOrderSelectionDialog
  const { toast } = useToast(); // Use the toast hook

  // Determine the current product ID to display (from form data, job order, or prop)
  const currentProductId = formData.projectSite || selectedJobOrder?.product_id || productId;
  console.log("ServiceAssignmentCard render - currentProductId:", currentProductId, "productId prop:", productId, "selectedJobOrder:", selectedJobOrder, "formData.projectSite:", formData.projectSite);

  // Set current time on component mount
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }));
  }, []);

  // Sync selectedJobOrder with jobOrderData prop
  useEffect(() => {
    setSelectedJobOrder(jobOrderData);
    setShowJobOrderDetails(!!jobOrderData);
  }, [jobOrderData]);

  // Auto-calculate service duration when dates or service type change
  useEffect(() => {
    const duration = calculateServiceDuration(formData.startDate, formData.endDate, formData.serviceType);
    if (duration && duration !== formData.serviceDuration) {
      handleInputChange("serviceDuration", duration);
    }
  }, [formData.startDate, formData.endDate, formData.serviceType]);


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
    // For monitoring, maintenance, and repair, duration is typically 1 day
    if (["Monitoring", "Maintenance", "Repair"].includes(serviceType)) {
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
    handleInputChange("campaignName", jobOrder.message || "");

    // Set materialSpecs from job order data
    handleInputChange("materialSpecs", jobOrder.materialSpec || "");

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
    // Clear job order data and reset form fields
    setSelectedJobOrder(null);
    setShowJobOrderDetails(false);
    // Call the parent callback to clear job order data
    if (onClearJobOrder) {
      onClearJobOrder();
    }
    // Re-open the job order selection dialog
    setShowJobOrderSelectionDialog(true);
  };

  return (
    <Card className="w-[90%] aspect-square bg-white border-3 border-dashed border-[#00D0FF] text-center" style={{ borderRadius: '20px', background: '#FFF', boxShadow: '-1.068px 2.136px 4.166px 0 rgba(0, 0, 0, 0.25)' }}>
      <CardContent className="flex flex-col lg:flex-row gap-4 p-4">
        <div className="flex flex-col gap-4 w-full lg:w-1/4">
          {/* Products card */}
          <Card className="aspect-square bg-[#E2E2E2] text-black p-4 flex flex-col justify-center items-center relative overflow-hidden">
            {currentProductId && products.find(p => p.id === currentProductId) ? (() => {
              const foundProduct = products.find(p => p.id === currentProductId);
              // Use same image logic as ProductSelectionDialog
              const image =
                foundProduct?.media && foundProduct.media.length > 0
                  ? foundProduct.media[0].url
                  : foundProduct?.content_type === "dynamic"
                    ? "/led-billboard-1.png"
                    : "/roadside-billboard.png";
              return (
                <img
                  src={image}
                  alt={foundProduct?.name || "Site Image"}
                  className="absolute inset-0 w-full h-full object-cover rounded-md cursor-pointer"
                  onClick={onOpenProductSelection}
                />
              );
            })() : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenProductSelection}
                  className=""
                  style={{
                    borderRadius: '10.681px',
                    border: '1.068px solid var(--DARK-GRAY, #A1A1A1)',
                    background: '#FFF',
                    boxShadow: '0 2.136px 2.136px 0 rgba(0, 0, 0, 0.25)',
                    width: '86.518px',
                    height: '17.09px',
                    flexShrink: 0,
                    color: 'var(--LIGHTER-BLACK, #333)',
                    textAlign: 'center',
                    fontFamily: 'Inter',
                    fontSize: '8.541px',
                    fontStyle: 'normal',
                    fontWeight: 500,
                    lineHeight: '100%'
                  }}
                >
                  Select Site
                </Button>
              </div>
            )}
          </Card>
          {/* Site Name and Location */}
          <div className="flex flex-col">
            <span className="text-left " style={{
              color: 'var(--LIGHTER-BLACK, #333)',
              fontFamily: 'Inter',
              fontSize: '16.022px',
              fontStyle: 'normal',
              fontWeight: 700,
              lineHeight: '100%'
            }}>
              {(() => {
                const foundProduct = products.find(p => p.id === currentProductId);
                console.log("Looking for product with ID:", currentProductId, "Found:", foundProduct);
                return foundProduct?.name || "Select Project Site";
              })()}
            </span>
            {currentProductId && (() => {
              const foundProduct = products.find(p => p.id === currentProductId);
              const location = foundProduct?.specs_rental?.location || foundProduct?.location;
              console.log("Product location:", location);
              return location && (
                <span className="text-left text-sm text-gray-500">
                  {location}
                </span>
              );
            })()}
          </div>
          {/* Remarks */}
          <div className="flex items-center">
            <Textarea
              id="remarks"
              placeholder="Remarks"
              value={formData.remarks}
              onChange={(e) => handleInputChange("remarks", e.target.value)}
              className="flex-1 aspect-square resize-none"
              style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}
            />
          </div>
        </div>
        <div className="flex flex-col gap-4 w-full lg:w-3/4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col text-sm">
              <p style={{ color: 'var(--LIGHTER-BLACK, #333)', fontFamily: 'Inter', fontSize: '16.022px', fontStyle: 'normal', fontWeight: 700, lineHeight: '100%' }}>SA#: {saNumber}</p>

            </div>
          </div>
          {/* Date Label */}
          <div className="flex items-center space-x-4">
            <Label className="w-32 flex-shrink-0 text-center" style={{ textAlign: 'left' }}>     Date:</Label>
            <span className="flex-1 text-start" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>{currentTime}</span>
          </div>
          {/* Service Type */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="serviceType" className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>Service Type:</Label>
            <Select value={formData.serviceType} onValueChange={(value) => handleInputChange("serviceType", value)}>
              <SelectTrigger id="serviceType" className="flex-1" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}>
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Roll Up" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Roll Up</SelectItem>
                <SelectItem value="Roll Down" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Roll Down</SelectItem>
                <SelectItem value="Monitoring" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Monitoring</SelectItem>
                <SelectItem value="Change Material" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Change Material</SelectItem>
                <SelectItem value="Maintenance" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Maintenance</SelectItem>
                <SelectItem value="Repair" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Repair</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Campaign Name */}
          {formData.serviceType !== "Maintenance" && formData.serviceType !== "Repair" && (
            <div className="flex items-center space-x-4">
              <Label htmlFor="campaignName" className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>
                Campaign Name: <span className="text-red-500">*</span>
              </Label>
              <Input
                id="campaignName"
                placeholder="Enter campaign name"
                value={formData.campaignName || ""}
                onChange={(e) => handleInputChange("campaignName", e.target.value)}
                className="flex-1"
                style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}
                required
              />
            </div>
          )}
          {/* Service Start Date */}
          <div className="flex items-center space-x-4">
            <Label className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>
              {["Monitoring", "Maintenance", "Repair"].includes(formData.serviceType) ? "Service Date:" : "Service Start Date:"}
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
                      <span style={{ fontSize: '10.681px' }}>Select Date</span>
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
          {/* Service End Date */}
          <div className="flex items-center space-x-4">
            <Label className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>Service End Date:</Label>
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
                      <span style={{ fontSize: '10.681px' }}>Select Date</span>
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
          {/* Service Duration */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="serviceDuration" className="w-32 flex-shrink-0 text-start">Service Duration:</Label>
            <div className="flex-1 flex items-center space-x-2">
              <Input
                id="serviceDuration"
                type="number"
                placeholder="0"
                value={formData.serviceDuration || ""}
                onChange={(e) => handleInputChange("serviceDuration", parseInt(e.target.value) || 0)}
                className="flex-1"
                style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}
                min="0"
              />
              <span className="text-sm text-gray-600 whitespace-nowrap">days</span>
            </div>
          </div>
          {/* Material Specs */}
          {!["Monitoring", "Change Material", "Maintenance", "Repair"].includes(formData.serviceType) && (
            <div className="flex items-center space-x-4">
              <Label htmlFor="materialSpecs" className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>
                Material Specs: <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.materialSpecs} onValueChange={(value) => handleInputChange("materialSpecs", value)}>
                <SelectTrigger id="materialSpecs" className="flex-1" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}>
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tarpaulin" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Tarpaulin</SelectItem>
                  <SelectItem value="Sticker" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Sticker</SelectItem>
                  <SelectItem value="Digital File" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Digital File</SelectItem>
                  <SelectItem value="Others" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Attachment */}
          <div className="flex items-start space-x-4">
            <Label htmlFor="attachment" className="w-32 flex-shrink-0 pt-2" style={{ textAlign: 'left' }}>Attachment:</Label>
            <div className="flex-1">
              {formData.serviceType === "Change Material" ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="w-[70px] h-[70px] flex flex-col justify-center items-center" style={{ background: 'rgba(196, 196, 196, 0.5)', borderRadius: '5.341px', gap: '0px' }}>
                      <div className="relative">
                        {selectedJobOrder?.siteImageUrl ? (
                          <img
                            src={selectedJobOrder.siteImageUrl}
                            alt="Old Material"
                            className="rounded-md h-6 w-6 object-cover"
                          />
                        ) : (
                          <img src="/logistics-sa-create-dl.png" alt="Old Material" className="rounded-md h-6 w-6 object-cover" />
                        )}
                        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-1 rounded text-sm font-medium">Old</div>
                      </div>
                      <p className="text-center text-sm text-gray-600" style={{ fontSize: '5.483px', fontStyle: 'normal', fontWeight: 600, lineHeight: '0.8', marginTop: '5px' }}>Upload</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <ArrowRight className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <div className="w-[70px] h-[70px] flex flex-col justify-center items-center" style={{ background: 'rgba(196, 196, 196, 0.5)', borderRadius: '5.341px', gap: '0px' }}>
                      <div className="relative">
                        {selectedJobOrder?.projectCompliance?.finalArtwork?.fileUrl ? (
                          <img
                            src={selectedJobOrder.projectCompliance.finalArtwork.fileUrl}
                            alt="New Material"
                            className="rounded-md h-6 w-6 object-cover"
                          />
                        ) : (
                          <img src="/logistics-sa-create-dl.png" alt="New Material" className="rounded-md h-6 w-6 object-cover" />
                        )}
                        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-1 rounded text-sm font-medium">New</div>
                      </div>
                      <p className="text-center text-sm text-gray-600" style={{ fontSize: '5.483px', fontStyle: 'normal', fontWeight: 600, lineHeight: '0.8', marginTop: '5px' }}>Upload</p>
                    </div>
                  </div>
                </div>
              ) : (
                selectedJobOrder?.projectCompliance?.finalArtwork?.fileUrl ? (
                  <div className="space-y-1">
                    <div className="w-[70px] h-[70px] flex flex-col justify-center items-center" style={{ background: 'rgba(196, 196, 196, 0.5)', borderRadius: '5.341px', gap: '0px' }}>
                      <img
                        src={selectedJobOrder.projectCompliance.finalArtwork.fileUrl}
                        alt="Site Image"
                        className="rounded-md h-6 w-6 object-cover"
                      />
                      <p className="text-center text-sm text-gray-600" style={{ fontSize: '5.483px', fontStyle: 'normal', fontWeight: 600, lineHeight: '0.8', marginTop: '5px' }}>Upload</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="w-[70px] h-[70px] flex flex-col justify-center items-center" style={{ background: 'rgba(196, 196, 196, 0.5)', borderRadius: '5.341px', gap: '0px' }}>
                      <img src="/logistics-sa-create-dl.png" alt="Attachment" className="rounded-md h-6 w-6 object-cover" />
                      <p className="text-center text-sm text-gray-600" style={{ fontSize: '5.483px', fontStyle: 'normal', fontWeight: 600, lineHeight: '0.8', marginTop: '5px' }}>Upload</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
          {/* Crew */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="crew" className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>
              Crew: <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.crew} onValueChange={(value) => {
              if (value === "add-new-team") {
                handleInputChange("crew", value);
              } else {
                handleInputChange("crew", value);
                handleInputChange("assignedTo", value);
              }
            }}>
              <SelectTrigger id="crew" className="flex-1" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}>
                <SelectValue placeholder="Choose a Crew" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id} style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>
                    {team.name}
                  </SelectItem>
                ))}
                <SelectItem value="add-new-team" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>+ Add New Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Gondola */}
          {!["Monitoring", "Maintenance", "Repair"].includes(formData.serviceType) && (
            <div className="flex items-center space-x-4">
              <Label className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>Gondola:</Label>
              <Select value={formData.gondola} onValueChange={(value) => handleInputChange("gondola", value)}>
                <SelectTrigger className="flex-1" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}>
                  <SelectValue placeholder="Select Yes or No" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>Yes</SelectItem>
                  <SelectItem value="No" style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%' }}>No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Logistics */}
          {!["Monitoring", "Maintenance", "Repair"].includes(formData.serviceType) && (
            <div className="flex items-center space-x-4">
              <Label className="w-32 flex-shrink-0" style={{ textAlign: 'left' }}>Logistics:</Label>
              <Input
                placeholder="Enter logistics details"
                value={formData.sales}
                onChange={(e) => handleInputChange("sales", e.target.value)}
                className="flex-1"
                style={{ color: 'var(--DARK-GRAY, #A1A1A1)', fontFamily: 'Inter', fontSize: '10.681px', fontStyle: 'normal', fontWeight: 500, lineHeight: '100%', borderRadius: '5.341px', border: '1.068px solid var(--GREY, #C4C4C4)', background: '#FFF' }}
              />
            </div>
          )}
        </div>
      </CardContent>



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
