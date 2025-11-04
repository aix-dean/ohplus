"use client";

import React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { createReport, ReportData } from "@/lib/report-service";
import { getTeams, getTeamById } from "@/lib/teams-service";
import {
  getProductById,
  uploadFileToFirebaseStorage,
  getBookingById,
} from "@/lib/firebase-service";
import { Timestamp } from "firebase/firestore";
import { ArrowLeft, Loader2, SquarePen, Upload } from "lucide-react";
import { Team } from "@/lib/types/team";
import { te } from "date-fns/locale";

interface CompanyData {
  id: string
  name?: string
  company_location?: any
  address?: any
  company_website?: string
  website?: string
  logo?: string
  contact_person?: string
  email?: string
  phone?: string
  social_media?: any
  created_by?: string
  created?: Date
  updated?: Date
}

export default function CreateReportPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userData } = useAuth();
  const assignmentId = params.id as string;

  const [assignmentData, setAssignmentData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingReport, setCreatingReport] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const [beforePhotos, setBeforePhotos] = useState<File[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<File[]>([]);
  const [completePercentage, setCompletePercentage] = useState(0);
  const [reportNumber, setReportNumber] = useState(`RPT#${Date.now()}`);
  const [remarks, setRemarks] = useState<string>("");
  const [beforePhotoAttachments, setBeforePhotoAttachments] = useState<
    Array<{
      note: string;
      fileName: string;
      fileType: string;
      fileUrl: string;
      label: string;
    }>
  >([]);
  const [afterPhotoAttachments, setAfterPhotoAttachments] = useState<
    Array<{
      note: string;
      fileName: string;
      fileType: string;
      fileUrl: string;
      label: string;
    }>
  >([]);
  const [photosAttachments, setPhotosAttachments] = useState<
    Array<{
      note: string;
      fileName: string;
      fileType: string;
      fileUrl: string;
      label: string;
    }>
  >([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [reportType, setReportType] = useState<string>("");
  const [teamsMap, setTeamsMap] = useState<Team>();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [companyDataLoading, setCompanyDataLoading] = useState(true);

  const updateBeforePhotoNote = useCallback((index: number, note: string) => {
    setBeforePhotoAttachments(prev => prev.map((att, i) => i === index ? {...att, note} : att));
  }, []);

  const updateAfterPhotoNote = useCallback((index: number, note: string) => {
    setAfterPhotoAttachments(prev => prev.map((att, i) => i === index ? {...att, note} : att));
  }, []);

  const updatePhotosNote = useCallback((index: number, note: string) => {
    setPhotosAttachments(prev => prev.map((att, i) => i === index ? {...att, note} : att));
  }, []);

  const onCreateAReportClick = useCallback(() => {
    router.back();
  }, [router]);

  const handleBeforePhotosChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      console.log("Uploading before photos:", files.length);
      setBeforePhotos((prev) => [...prev, ...files]);
      setUploadingPhotos(true);

      // Upload photos immediately
      const isMonitoring = assignmentData?.serviceType === "Monitoring";
      const note = "";
      const label = isMonitoring ? "Monitoring" : "Before";

      try {
        await Promise.all(
          files.map(async (photo) => {
            try {
              console.log("Uploading photo:", photo.name);
              const downloadURL = await uploadFileToFirebaseStorage(
                photo,
                `reports/photos/`
              );
              console.log("Upload successful for:", photo.name, downloadURL);
              const attachment = {
                note: note,
                fileName: photo.name,
                fileType: photo.type,
                fileUrl: downloadURL,
                label: label,
              };
              if (isMonitoring) {
                setPhotosAttachments((prev) => [...prev, attachment]);
              } else {
                setBeforePhotoAttachments((prev) => [...prev, attachment]);
              }
              console.log("Attachment added to state:", attachment);
            } catch (uploadError) {
              console.error("Error uploading before photo:", photo.name, uploadError);
              // Could show error to user here
            }
          })
        );
      } finally {
        setUploadingPhotos(false);
      }
    },
    [assignmentData?.serviceType]
  );

  const handleAfterPhotosChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      console.log("Uploading after photos:", files.length);
      setAfterPhotos((prev) => [...prev, ...files]);
      setUploadingPhotos(true);

      // Upload photos immediately
      const note = "";
      const label = "After";

      try {
        await Promise.all(
          files.map(async (photo) => {
            try {
              console.log("Uploading photo:", photo.name);
              const downloadURL = await uploadFileToFirebaseStorage(
                photo,
                `reports/photos/`
              );
              console.log("Upload successful for:", photo.name, downloadURL);
              const attachment = {
                note: note,
                fileName: photo.name,
                fileType: photo.type,
                fileUrl: downloadURL,
                label: label,
              };
              setAfterPhotoAttachments((prev) => [...prev, attachment]);
              console.log("Attachment added to state:", attachment);
            } catch (uploadError) {
              console.error("Error uploading after photo:", photo.name, uploadError);
              // Could show error to user here
            }
          })
        );
      } finally {
        setUploadingPhotos(false);
      }
    },
    []
  );

  const createReportFromAssignment = useCallback(async () => {
    if (!assignmentData || !user) return;

    setCreatingReport(true);
    setError(null);

    try {
      // Collect all attachments
      const assignmentAttachments = assignmentData.attachments?.map((att: any) => ({
        note: att.name || "",
        fileName: att.name || "attachment",
        fileType: att.type || "unknown",
        fileUrl: "",
        label: att.name || "",
      })) || [];

      console.log("Assignment attachments:", assignmentAttachments.length);

      const uploadedAttachments = [...assignmentAttachments];

      // Add pre-uploaded attachments
      if (assignmentData?.serviceType === "Monitoring") {
        console.log("Photos attachments:", photosAttachments.length);
        uploadedAttachments.push(...photosAttachments);
      } else {
        console.log("Before photo attachments:", beforePhotoAttachments.length);
        console.log("After photo attachments:", afterPhotoAttachments.length);
        uploadedAttachments.push(...beforePhotoAttachments);
        uploadedAttachments.push(...afterPhotoAttachments);
      }

      console.log("Total uploaded attachments before processing:", uploadedAttachments.length);
      console.log(`Remarks: ${remarks}`)
      // Map service assignment data to report data
      const reportData: ReportData = {
        site: {
          id: assignmentData.projectSiteId || "",
          name: assignmentData.projectSiteName || "",
          location: assignmentData.projectSiteLocation || "",
          media_url: bookingData?.items?.media_url || "",
        },
        materialSpecs: assignmentData.materialSpecs || "",
        report_id: reportNumber || "",
        companyId: assignmentData.company_id || "",
        client: bookingData?.client || null,
        sellerId: user.uid,
        requestedBy: {
          department: assignmentData.requestedBy?.department || "",
          name: assignmentData.requestedBy?.name || "",
          id: assignmentData.requestedBy?.id || "",
        },
        remarks: remarks || "",
        campaignName: assignmentData.campaignName || "",
        joNumber: assignmentData.joNumber || "",
        joType: assignmentData.joType || "",
        joRequestBy: assignmentData.joRequestBy || "",
        bookingDates: {
          start: bookingData.start_date || Timestamp.now(),
          end: bookingData.end_date || Timestamp.now(),
        },
        start_date: assignmentData.coveredDateStart || Timestamp.now(),
        end_date: assignmentData.coveredDateEnd || Timestamp.now(),
        booking_id: assignmentData.booking_id || "",
        sales: assignmentData.sales || "",
        saNumber: assignmentData.saNumber || "",
        saId: assignmentData.id || "",
        saType: assignmentData.serviceType || "",
        reportType: reportType,
        attachments: uploadedAttachments,
        status: "draft",
        createdBy: user.uid,
        completionPercentage: completePercentage,
        tags: [assignmentData.serviceType || "service"],
        crew: assignmentData.crew || "",
        assignedTo: assignmentData.assignedToName || "",
        costEstimateId: assignmentData.costEstimateId || "",
        quotationId: assignmentData.quotationId || "",
      };


   
      const reportId = await createReport(reportData);


      setCreatedReportId(reportId);

      // Generate PDF after report creation using API
      try {
        const response = await fetch('/api/generate-report-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reportId: reportId,
            companyData: companyData,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to generate PDF: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log("PDF generated and uploaded successfully. Download URL:", result.downloadURL);
      } catch (pdfError) {
        console.error("Error generating PDF:", pdfError);
        // Don't fail the report creation if PDF generation fails
      }

      // Navigate to the created report page
      setTimeout(() => {
        router.push(`/logistics/reports/${reportId}`);
      }, 1000);
    } catch (err) {
      console.error("Error creating report:", err);
      setError("Failed to create report. Please try again.");
    } finally {
      setCreatingReport(false);
    }
  }, [
    assignmentData,
    user,
    router,
    beforePhotoAttachments,
    afterPhotoAttachments,
    photosAttachments,
    bookingData,
    completePercentage,
    reportType,
    reportNumber,
  ]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    } else {
      setError("No assignment ID provided");
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    // Prioritize serviceType over URL params for validation
    if (assignmentData?.serviceType === "Monitoring") {
      setReportType("Monitoring Report");
    } else {
      // Check for reportType from URL params
      const urlReportType = searchParams.get("reportType");
      if (urlReportType) {
        if (urlReportType === "progress") {
          setReportType("Progress Report");
        } else if (urlReportType === "completion") {
          setReportType("Completion Report");
        } else if (urlReportType === "monitoring") {
          setReportType("Monitoring Report");
        }
      } else {
        setReportType("Progress Report");
      }
    }
  }, [assignmentData, searchParams]);


  useEffect(() => {
    console.log("[v0] useEffect triggered - user:", !!user)
    if (user) {
      console.log("[v0] Calling fetchCompanyData")
      fetchCompanyData()
    }
  }, [user])

  const fetchCompanyData = useCallback(async () => {
    if (!userData) {
      console.log("[v0] fetchCompanyData: Missing user")
      setCompanyDataLoading(false)
      return
    }

    try {

      if (!userData?.company_id) {
        console.warn("[v0] No company_id found in userData:", userData)
        setCompanyDataLoading(false)
        return
      }

      console.log("[v0] Fetching company data for company_id:", userData?.company_id)
      const companyDoc = await getDoc(doc(db, "companies", userData?.company_id))

      if (companyDoc.exists()) {
        const companyData = { id: companyDoc.id, ...companyDoc.data() } as CompanyData
        console.log("[v0] Company data fetched successfully:", companyData)
        setCompanyData(companyData)
      } else {
        console.warn("[v0] No company data found for company_id:", userData?.company_id)
      }
    } catch (error) {
      console.error("[v0] Error fetching company data:", error)
    } finally {
      setCompanyDataLoading(false)
    }
  }, [userData])

  const fetchAssignmentData = useCallback(async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      setError(null);

      const assignmentDoc = await getDoc(
        doc(db, "service_assignments", assignmentId)
      );

      if (assignmentDoc.exists()) {
        const data = { id: assignmentDoc.id, ...assignmentDoc.data() };
        setAssignmentData(data);

        // Fetch all data concurrently
        const fetchPromises = [];

        // Fetch product details using projectSiteId
        if ((data as any).projectSiteId) {
          fetchPromises.push(
            getProductById((data as any).projectSiteId)
              .then((product) => setProductData(product))
              .catch((productErr) => {
                console.error("Error fetching product:", productErr);
                // Don't set error for product fetch failure, just log it
              })
          );
        }

        // Fetch booking details using booking_id
        if ((data as any).booking_id) {
          fetchPromises.push(
            getBookingById((data as any).booking_id)
              .then((booking) => {
                setBookingData(booking);
                console.log(
                  `bookings SA data: ${JSON.stringify(booking?.items)}`
                );
              })
              .catch((bookingErr) => {
                console.error("Error fetching booking:", bookingErr);
                // Don't set error for booking fetch failure, just log it
              })
          );
        }

        // Wait for all fetches to complete
        await Promise.all(fetchPromises);
      } else {
        setError("Assignment not found");
      }
    } catch (err) {
      console.error("Error fetching assignment:", err);
      setError("Failed to load assignment data");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading assignment data...</p>
        </div>
      </div>
    );
  }

  const getTeamName = async (teamId: string) => {
    
    if(teamId){
      const team = await getTeamById(teamId);
      return team?.name || "";
    }else{  
      return "N/A"
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">{error}</p>
          <button
            onClick={() =>
              router.push("/logistics/reports/select-service-assignment")
            }
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Select Service Assignment
          </button>
        </div>
      </div>
    );
  }

  if (!assignmentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No assignment data available</p>
          <button
            onClick={() =>
              router.push("/logistics/reports/select-service-assignment")
            }
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Select Service Assignment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl p-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={onCreateAReportClick}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create a Report</h1>
        </div>

        {/* Metadata Header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
            <div>
              <p className="font-semibold">SA I.D.</p>
              <p>{assignmentData?.saNumber || "SA000582"}</p>
            </div>
            <div>
              <p className="font-semibold">Type</p>
              <p>{assignmentData?.serviceType || "Roll Up"}</p>
            </div>
            <div>
              <p className="font-semibold">Site</p>
              <p className="text-blue-600 font-semibold">
                {productData?.name ||
                  assignmentData?.projectSiteName ||
                  "Petplans Tower"}
              </p>
            </div>
            <div>
              <p className="font-semibold">Campaign Name</p>
              <p>{assignmentData?.campaignName || "Mcdonald's"}</p>
            </div>
            <div>
              <p className="font-semibold">Crew</p>
              <p>
                { assignmentData.assignedToName ||
                  "Production- Jonathan Dela Cruz"}
              </p>
            </div>
            <div>
              <p className="font-semibold">Deadline</p>
              <p>
                {assignmentData?.coveredDateEnd
                  ?.toDate?.()
                  ?.toLocaleDateString() || "Oct 18, 2025"}
              </p>
            </div>
            <div className="flex justify-start items-center">
              <button
                onClick={() =>
                  router.push(`/logistics/assignments/${assignmentId}`)
                }
                className="px-4 h-[24px] w-[103px] border border-[#c4c4c4] rounded text-xs font-medium hover:bg-gray-50"
              >
                View SA
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row w-full gap-4">
            {/* Left Column - Site Image and Remarks */}
            <div className="w-[182px] flex-shrink-0 relative">
              {/* Site Image */}
              <Image
                src={
                  bookingData?.items?.media_url ||
                  assignmentData?.siteImage ||
                  "/placeholder.jpg"
                }
                alt="Site"
                width={182}
                height={284}
                className="object-cover rounded-md"
              />
              {/* Site Info */}
              <div>
                <p className="font-bold text-[18px]">
                  {productData?.name ||
                    assignmentData?.projectSiteName ||
                    "Petplans Tower NB"}
                </p>
                <div className="text-xs text-gray-600 break-words w-[182px]">
                  {productData?.specs_rental?.location ||
                    assignmentData?.projectSiteLocation ||
                    "EDSA, Guadalupe"}
                </div>
              </div>

              {/* Remarks */}
              <div className="mt-4">
                <textarea
                  className="w-[182px] h-[64px] p-3 text-xs text-[#c4c4c4] border border-[#c4c4c4] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Remarks"
                  aria-label="Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>
            </div>

            {/* Middle Column - Report Details */}
            <div className="space-y-4 flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-8">
                  <p className="text-[18px] font-bold">{reportNumber}</p>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    Date:
                  </label>
                  <p className="text-xs font-medium">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    SA No.:
                  </label>
                  <p className="text-xs font-medium">
                    {assignmentData?.saNumber || "SA000582"}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    SA Type:
                  </label>
                  <p className="text-xs font-medium">
                    {assignmentData?.serviceType || "Roll Up"}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    Report Type:
                  </label>
                  <div className="relative flex-1">
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full pl-2 font-medium text-xs h-[25px] border-[1.2px] border-[#c4c4c4] rounded-[6.05px] text-[#333] focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8 [&::-webkit-appearance]:none [-webkit-appearance]:none appearance-none"
                    >
                      {assignmentData?.serviceType === "Monitoring" ? (
                        <option value="Monitoring Report">
                          Monitoring Report
                        </option>
                      ) : (
                        <>
                          <option value="Progress Report">
                            Progress Report
                          </option>
                          <option value="Completion Report">
                            Completion Report
                          </option>
                        </>
                      )}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    Site:
                  </label>
                  <p className="text-xs font-medium">
                    {productData?.name ||
                      assignmentData?.projectSiteName ||
                      "Petplans Tower NB"}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    Campaign Name:
                  </label>
                  <p className="text-xs font-medium">
                    {assignmentData?.campaignName || "Mcdonald's"}
                  </p>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    Start:
                  </label>
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full text-xs h-[25px] font-medium p-2 border-[1.2px] border-[#c4c4c4] text-[#c4c4c4] rounded-[6.05px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue={assignmentData.coveredDateStart
                          .toDate()
                          .toLocaleDateString("en-CA")}
                      />
                    </div>
                    <input
                      type="time"
                      className="flex-1 text-xs h-[25px] font-medium p-2 border-[1.2px] border-[#c4c4c4] text-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [-webkit-appearance:none] [appearance:none]"
                      defaultValue={assignmentData.coveredDateStart
                        .toDate()
                        .toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    End:
                  </label>
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <input
                        type="date"
                        className="w-full text-xs h-[25px] font-medium p-2 border-[1.2px] border-[#c4c4c4] text-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue={assignmentData.coveredDateEnd
                          .toDate()
                          .toLocaleDateString("en-CA")}
                      />
                    </div>
                    <input
                      type="time"
                      className="flex-1  text-xs h-[25px] font-medium p-2 border-[1.2px] border-[#c4c4c4] text-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [-webkit-appearance:none] [appearance:none]"
                      defaultValue={assignmentData.coveredDateEnd
                        .toDate()
                        .toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <label className="text-xs font-semibold min-w-[120px]">
                    Crew:
                  </label>
                  <input
                    type="text"
                    className="flex-1  text-xs h-[25px] font-medium p-2 border-[1.2px] border-[#c4c4c4] text-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent "
                    value={
                      assignmentData?.assignedToName ||
                      ""
                    }
                    readOnly
                  />
                </div>
                {reportType === "Progress Report" && (
                  <div className="flex items-center gap-8">
                    <label className="text-xs font-semibold min-w-[120px]">
                      Status:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20  text-xs h-[25px] font-medium p-2 border-[1.2px] border-[#c4c4c4] text-[#c4c4c4] rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                        value={completePercentage}
                        onChange={(e) => {
                          const value = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setCompletePercentage(value);
                        }}
                      />
                      <span className="text-sm text-gray-600">of 100%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Photo Uploads */}
            <div className="space-y-6 flex-1">
              {assignmentData?.serviceType === "Monitoring" ? (
                /* Photos for Monitoring */
                <div className="h-[140px]">
                  <h4 className="text-xs font-semibold text-gray-900 mb-3 leading-[100%]">
                    Photos:{" "}
                  </h4>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="mb-1">
                      {photosAttachments.length > 0 ? (
                        <div className="flex items-start gap-2 overflow-x-auto flex-1 min-w-0">
                          {/* Image Previews with Notes */}
                          {photosAttachments.map((att, index) => (
                            <div key={index} className="relative flex-shrink-0">
                              <Image
                                src={att.fileUrl}
                                alt={`Photo ${index + 1}`}
                                width={85}
                                height={85}
                                className="h-[85px] w-[85px] object-cover rounded border"
                              />
                              <textarea
                                className="w-[85px] border border-[#c4c4c4] mt-1 text-[#c4c4c4] pl-2 py-1 rounded-lg text-xs resize-none focus:outline-none"
                                rows={1}
                                placeholder="Add note..."
                                value={att.note}
                                onChange={(e) => updatePhotosNote(index, e.target.value)}
                              />
                            </div>
                          ))}

                          {/* Upload Button - Fixed Width */}
                          <div className="h-[85px] w-[85px] border-2 border-dashed border-[#c4c4c4] rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id="photos"
                              onChange={handleBeforePhotosChange}
                              aria-label="Upload photos"
                            />
                            <label
                              htmlFor="photos"
                              className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mb-1" />
                              <div className="text-gray-500 text-xs text-center">
                                Upload
                              </div>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-[#c4c4c4] rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            id="photos"
                            onChange={handleBeforePhotosChange}
                            aria-label="Upload photos"
                          />
                          <label
                            htmlFor="photos"
                            className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                          >
                            <Upload className="w-8 h-8 text-gray-400 mb-1" />
                            <div className="text-gray-500 text-xs text-center">
                              Upload
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Before SA Photos */}
                  <div>
                    <h4 className="text-xs flex justify-between font-semibold text-gray-900 mb-3 leading-[100%]">
                      Before SA Photos:{" "}
                      <SquarePen className="h-4 w-4 text-gray-500" />{" "}
                    </h4>
                    <div className="bg-gray-100 rounded-lg p-3 h-[140px]">
                      <div className="mb-1">
                        {beforePhotoAttachments.length > 0 ? (
                          <div className="flex items-start gap-2 overflow-x-auto flex-1 min-w-0">
                            {/* Image Previews with Notes */}
                            {beforePhotoAttachments.map((att, index) => (
                              <div
                                key={index}
                                className="relative flex-shrink-0"
                              >
                                <Image
                                  src={att.fileUrl}
                                  alt={`Before photo ${index + 1}`}
                                  width={85}
                                  height={85}
                                  className="h-[85px] w-[85px] object-cover rounded border"
                                />
                                <textarea
                                  className="w-[85px] border border-[#c4c4c4] mt-1 text-[#c4c4c4] pl-2 py-1 rounded-lg text-xs resize-none focus:outline-none"
                                  rows={1}
                                  placeholder="Add note..."
                                  value={att.note}
                                  onChange={(e) => updateBeforePhotoNote(index, e.target.value)}
                                />
                              </div>
                            ))}

                            {/* Upload Button - Fixed Width */}
                            <div className="w-[85px] h-[85px] border-2 border-dashed border-[#c4c4c4] rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                id="before-photos"
                                onChange={handleBeforePhotosChange}
                                aria-label="Upload before SA photos"
                              />
                              <label
                                htmlFor="before-photos"
                                className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                              >
                                <Upload className="w-8 h-8 text-gray-400 mb-1" />
                                <div className="text-gray-500 text-xs text-center">
                                  Upload
                                </div>
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="w-[85px] h-[85px] border-2 border-dashed border-[#c4c4c4] rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id="before-photos"
                              onChange={handleBeforePhotosChange}
                              aria-label="Upload before SA photos"
                            />
                            <label
                              htmlFor="before-photos"
                              className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mb-1" />
                              <div className="text-gray-500 text-xs text-center">
                                Upload
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* After SA Photos */}
                  <div>
                    <h4 className="text-xs flex justify-between font-semibold text-gray-900 mb-3 leading-[100%]">
                      After SA Photos:{" "}
                      <SquarePen className="h-4 w-4 text-gray-500" />{" "}
                    </h4>
                    <div className="bg-gray-100 rounded-lg p-3 h-[140px]">
                      <div className="mb-1">
                        {afterPhotoAttachments.length > 0 ? (
                          <div className="flex items-start gap-2 overflow-x-auto flex-1 min-w-0">
                            {/* Image Previews with Notes */}
                            {afterPhotoAttachments.map((att, index) => (
                              <div
                                key={index}
                                className="relative flex-shrink-0"
                              >
                                <Image
                                  src={att.fileUrl}
                                  alt={`After photo ${index + 1}`}
                                  width={85}
                                  height={85}
                                  className="h-[85px] w-[85px] object-cover rounded border"
                                />
                                <textarea
                                  className="w-[85px] border border-[#c4c4c4] mt-1 text-[#c4c4c4] pl-2 py-1 rounded-lg text-xs resize-none focus:outline-none"
                                  rows={1}
                                  placeholder="Add note..."
                                  value={att.note}
                                  onChange={(e) => updateAfterPhotoNote(index, e.target.value)}
                                />
                              </div>
                            ))}

                            {/* Upload Button - Fixed Width */}
                            <div className="w-[85px] h-[85px] border-2 border-dashed border-[#c4c4c4] rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center flex-shrink-0">
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                id="after-photos"
                                onChange={handleAfterPhotosChange}
                                aria-label="Upload after SA photos"
                              />
                              <label
                                htmlFor="after-photos"
                                className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                              >
                                <Upload className="w-8 h-8 text-gray-400 mb-1" />
                                <div className="text-gray-500 text-xs text-center">
                                  Upload
                                </div>
                              </label>
                            </div>
                          </div>
                        ) : (
                          <div className="w-[85px] h-[85px] border-2 border-dashed border-[#c4c4c4] rounded-lg bg-gray-200 hover:bg-gray-100 transition-colors flex items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              id="after-photos"
                              onChange={handleAfterPhotosChange}
                              aria-label="Upload after SA photos"
                            />
                            <label
                              htmlFor="after-photos"
                              className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-2"
                            >
                              <Upload className="w-8 h-8 text-gray-400 mb-1" />
                              <div className="text-gray-500 text-xs text-center">
                                Upload
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-center align-center">
          <div className="rounded-[50px] shadow-md p-2 bg-white h-[67px] flex items-center justify-center w-[346px]">
            <div className="flex gap-2 align-center">
              <button className="px-4 text-gray-700 rounded-lg underline hover:bg-gray-50 font-semibold transition-colors text-sm">
                Save as Draft
              </button>
              <button
                onClick={createReportFromAssignment}
                disabled={creatingReport || companyDataLoading || uploadingPhotos}
                className="bg-[#1d0beb] h-[27px] w-[159px] text-xs text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                aria-label="Generate Report"
              >
                {creatingReport ? <>Generating...</> : companyDataLoading ? "Loading..." : uploadingPhotos ? "Uploading..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

