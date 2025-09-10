import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface JobOrder {
  id: string;
  jo_number: string;
  campaign_name: string;
  product_id: string;
  name: string; // Add name field
  description: string; // Add description field
}

interface JobOrderSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  jobOrders: JobOrder[];
  onSelectJobOrder: (jobOrder: JobOrder) => void;
}

export function JobOrderSelectionDialog({ isOpen, onClose, jobOrders, onSelectJobOrder }: JobOrderSelectionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <DialogHeader>
          <DialogTitle>Select Job Order</DialogTitle>
          <DialogDescription>
            Select a job order from the list below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {jobOrders.length === 0 ? (
            <p>No job orders available.</p>
          ) : (
            <ScrollArea className="h-72 w-full rounded-md border">
              <div className="p-4">
                {jobOrders.map((jobOrder) => (
                  <Button
                    key={jobOrder.id}
                    variant="ghost"
                    className="w-full justify-start mb-2"
                    onClick={() => onSelectJobOrder(jobOrder)}
                  >
                    JO#: {jobOrder.jo_number} - {jobOrder.name} - {jobOrder.description}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        <Button onClick={onClose}>Cancel</Button>
      </DialogContent>
    </Dialog>
  );
}