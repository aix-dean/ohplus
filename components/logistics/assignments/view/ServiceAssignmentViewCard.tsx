import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { format } from "date-fns";
import type { Product } from "@/lib/firebase-service";
import type { Team } from "@/lib/types/team";
import type { JobOrder } from "@/lib/types/job-order";

interface ServiceAssignmentViewCardProps {
  assignmentData: any;
  products: Product[];
  teams: Team[];
  jobOrderData: JobOrder | null;
}

export function ServiceAssignmentViewCard({
  assignmentData,
  products,
  teams,
  jobOrderData,
}: ServiceAssignmentViewCardProps) {
  const [currentTime, setCurrentTime] = useState("");

  // Set current time on component mount
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }));
  }, []);

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

  // Get site information - prioritize assignment data, then fall back to product lookup
  const siteCode = selectedProduct?.site_code || assignmentData.projectSiteId?.substring(0, 8) || "-";
  const siteName = assignmentData.projectSiteName || selectedProduct?.name || "-";

  return (
    <Card className="p-0 shadow-lg border-0">
      <div className="bg-gray-50">
        {/* Empty card - all content removed as requested */}
      </div>
    </Card>
  );
}