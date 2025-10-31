import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";
import type { Product } from "@/lib/firebase-service";
import type { Team } from "@/lib/types/team";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Printer, Bell, ChevronDown, FileText, Share, X, Download } from "lucide-react";

interface ServiceAssignmentSummaryBarProps {
  assignmentData: any;
  products: Product[];
  teams: Team[];
  onEdit?: () => void;
  onPrint?: () => void;
  onSetAlarm?: () => void;
  onCreateReport?: () => void;
  onShare?: () => void;
  onCancelSA?: () => void;
  onDownload?: () => void;
}

export function ServiceAssignmentSummaryBar({
  assignmentData,
  products,
  teams,
  onEdit,
  onPrint,
  onSetAlarm,
  onCreateReport,
  onShare,
  onCancelSA,
  onDownload,
}: ServiceAssignmentSummaryBarProps) {
  // Helper function to safely parse and validate dates
  const parseDateSafely = (dateValue: any): Date | null => {
    if (!dateValue) return null;

    try {
      let date: Date;

      if (dateValue instanceof Date) {
        date = dateValue;
      } else if (typeof dateValue === 'string') {
        date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return null;
        }
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue * 1000);
      } else if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        date = new Date(dateValue.seconds * 1000);
      } else {
        return null;
      }

      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch (error) {
      console.warn('Error parsing date:', dateValue, error);
      return null;
    }
  };

  const selectedProduct = products.find(p => p.id === assignmentData.projectSiteId);
  const selectedTeam = teams.find(t => t.id === assignmentData.crew);

  // Get site information
  const siteName = assignmentData.projectSiteName || selectedProduct?.name || "-";

  // Format issued date
  const issuedDate = parseDateSafely(assignmentData.created) || parseDateSafely(assignmentData.createdAt);
  const formattedIssuedDate = issuedDate ? format(issuedDate, "MMM d, yyyy") : "-";

  return (
    <div className="bg-white rounded-t-lg px-5 py-3.5 flex items-start justify-between text-xs shadow-sm">
      <div className="flex gap-16">
        <div>
          <div className="text-gray-600 mb-0.5">SA ID</div>
          <div className="font-semibold text-gray-900">{assignmentData.saNumber || "-"}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Type</div>
          <div className="font-semibold text-gray-900">{assignmentData.serviceType || "-"}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Site</div>
          <div className="font-semibold text-blue-600">{siteName}</div>
        </div>
        {assignmentData.serviceType !== "Maintenance" && assignmentData.serviceType !== "Repair" && (
          <div>
            <div className="text-gray-600 mb-0.5">Campaign Name</div>
            <div className="font-semibold text-gray-900">{assignmentData.campaignName || "-"}</div>
          </div>
        )}
        <div>
          <div className="text-gray-600 mb-0.5">Crew</div>
          <div className="font-semibold text-gray-900">{selectedTeam?.name || assignmentData.assignedToName || "-"}</div>
        </div>
        <div>
          <div className="text-gray-600 mb-0.5">Issued</div>
          <div className="font-semibold text-gray-900">{formattedIssuedDate}</div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="text-xs h-7 border-gray-300 bg-transparent">
            Actions <ChevronDown className="w-3 h-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onCreateReport}>
            <FileText className="w-4 h-4 mr-2" />
            Create Report
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onShare}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onCancelSA}>
            <X className="w-4 h-4 mr-2" />
            Cancel SA
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}