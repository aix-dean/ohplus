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

export function ServiceAssignmentCard({ companyId, productId }: { companyId: string | null; productId: string }) {
  const [showJobOrderDetails, setShowJobOrderDetails] = useState(false); // State to manage JobOrderDetailsCard visibility
  const [selectedJobOrder, setSelectedJobOrder] = useState<JobOrder | null>(null); // State to hold selected job order data
  const [saNumber, setSaNumber] = useState(""); // State for randomly generated SA number
  const [currentTime, setCurrentTime] = useState(""); // State for current time display
  const [selectedServiceType, setSelectedServiceType] = useState("roll-up"); // State for selected service type

  // Generate random SA number and set current time on component mount
  useEffect(() => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setSaNumber(randomNum.toString());

    const now = new Date();
    setCurrentTime(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }));
  }, []);

  const handleIdentifyJOClick = async () => {
    try {
      // Query job_orders where product_id matches the current productId
      const jobOrdersRef = collection(db, "job_orders");
      const q = query(
        jobOrdersRef,
        where("product_id", "==", productId),
        orderBy("created", "desc"),
        limit(10) // Get up to 10 most recent job orders for this product
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Get the most recent job order for this product
        const doc = querySnapshot.docs[0];
        const jobOrderData = doc.data();
        const fetchedJobOrder: JobOrder = {
          id: doc.id,
          joNumber: jobOrderData.joNumber || "N/A",
          siteName: jobOrderData.siteName || "N/A",
          siteLocation: jobOrderData.siteLocation || "",
          joType: jobOrderData.joType || "Other",
          requestedBy: jobOrderData.requestedBy || "N/A",
          assignTo: jobOrderData.assignTo || "",
          dateRequested: jobOrderData.dateRequested || "",
          deadline: jobOrderData.deadline || "",
          jobDescription: jobOrderData.jobDescription || "",
          message: jobOrderData.message || "",
          attachments: jobOrderData.attachments || [],
          status: jobOrderData.status || "draft",
          created: jobOrderData.created,
          updated: jobOrderData.updated,
          created_by: jobOrderData.created_by || "",
          company_id: jobOrderData.company_id || "",
          quotation_id: jobOrderData.quotation_id,
          clientCompany: jobOrderData.clientCompany,
          clientName: jobOrderData.clientName,
          contractDuration: jobOrderData.contractDuration,
          contractPeriodEnd: jobOrderData.contractPeriodEnd,
          contractPeriodStart: jobOrderData.contractPeriodStart,
          leaseRatePerMonth: jobOrderData.leaseRatePerMonth,
          missingCompliance: jobOrderData.missingCompliance,
          quotationNumber: jobOrderData.quotationNumber,
          remarks: jobOrderData.remarks,
          product_id: jobOrderData.product_id,
          projectCompliance: jobOrderData.projectCompliance,
          dtiBirUrl: jobOrderData.dtiBirUrl,
          gisUrl: jobOrderData.gisUrl,
          idSignatureUrl: jobOrderData.idSignatureUrl,
          siteImageUrl: jobOrderData.siteImageUrl,
        };
        setSelectedJobOrder(fetchedJobOrder);
        setShowJobOrderDetails(true);
      } else {
        alert(`No job orders found for this product (${productId}).`);
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
              <p>SA#: {saNumber}</p>
            </div>
            <p className="text-sm">{currentTime}</p>
          </div>
          <CardContent className="grid gap-4">
            {/* Service Type - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceType" className="w-32 flex-shrink-0">Service Type:</Label>
              <Select value={selectedServiceType} onValueChange={setSelectedServiceType}>
                <SelectTrigger id="serviceType" className="flex-1">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="roll-up">Roll Up</SelectItem>
                  <SelectItem value="roll-down">Roll Down</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="change-material">Change Material</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campaign Name - Row Layout */}
            {selectedServiceType !== "maintenance" && (
              <div className="flex items-center space-x-4">
                <Label htmlFor="campaignName" className="w-32 flex-shrink-0">Campaign Name:</Label>
                <Input id="campaignName" placeholder="Enter campaign name" defaultValue="Petplans NB Campaign" className="flex-1" />
              </div>
            )}

            {/* Service Start Date - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceStartDate" className="w-32 flex-shrink-0">
                {["monitoring", "maintenance"].includes(selectedServiceType) ? "Service Date:" : "Service Start Date:"}
              </Label>
              <div className="relative flex-1">
                <Input id="serviceStartDate" type="text" placeholder="-Choose Date-" defaultValue="Sep 5, 2025" className="pr-8" />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Service End Date - Row Layout */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceEndDate" className="w-32 flex-shrink-0">Service End Date:</Label>
              <div className="relative flex-1">
                <Input id="serviceEndDate" type="text" placeholder="-Choose Date-" defaultValue="Sep 5, 2025" className="pr-8" />
                <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="serviceDuration" className="w-32 flex-shrink-0">Service Duration:</Label>
              <Input id="serviceDuration" placeholder="Enter service duration" defaultValue="1 Day" className="flex-1" />
            </div>

            {!["monitoring", "change-material", "maintenance"].includes(selectedServiceType) && (
              <div className="flex items-center space-x-4">
                <Label htmlFor="materialSpecs" className="w-32 flex-shrink-0">Material Specs:</Label>
                <Select>
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
                {selectedServiceType === "change-material" ? (
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
              <Input id="remarks" placeholder="Add any remarks here" defaultValue="Client requested early morning service." className="flex-1" />
            </div>

            <div className="flex items-center space-x-4">
              <Label htmlFor="crew" className="w-32 flex-shrink-0">Crew:</Label>
              <Select>
                <SelectTrigger id="crew" className="flex-1">
                  <SelectValue placeholder="Choose a Crew" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crew1">Crew Alpha</SelectItem>
                  <SelectItem value="crew2">Crew Beta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!["monitoring", "change-material", "maintenance"].includes(selectedServiceType) && (
              <div className="flex items-center space-x-4">
                <Label className="w-32 flex-shrink-0">Illumination/Nits:</Label>
                <p className="font-medium flex-1">10PCS of 1000W metal halide</p>
              </div>
            )}

            {!["monitoring", "maintenance"].includes(selectedServiceType) && (
              <div className="flex items-center space-x-4">
                <Label className="w-32 flex-shrink-0">Gondola:</Label>
                <p className="font-medium flex-1">YES</p>
              </div>
            )}


            {!["monitoring", "maintenance"].includes(selectedServiceType) && (
              <div className="flex items-center space-x-4">
                <Label className="w-32 flex-shrink-0">Logistics:</Label>
                <p className="font-medium flex-1">May Tuyan</p>
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
    </Card>
  );
}