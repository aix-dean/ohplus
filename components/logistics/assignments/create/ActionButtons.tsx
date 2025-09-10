import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";

export function ActionButtons({
  onSaveAsDraft,
  onSubmit,
  loading,
}: {
  onSaveAsDraft: () => Promise<void>;
  onSubmit: () => Promise<void>;
  loading: boolean;
}) {
  return (
    <div className="flex justify-end space-x-4 mt-4">
      <Button variant="outline" onClick={onSaveAsDraft} disabled={loading}>
        Save as Draft
      </Button>
      <Button onClick={onSubmit} disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit SA
      </Button>
    </div>
  );
}