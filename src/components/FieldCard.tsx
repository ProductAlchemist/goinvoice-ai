import ConfidenceBadge from "./ConfidenceBadge";
import type { FieldWithConfidence } from "@/types/invoice";

interface FieldCardProps {
  label: string;
  field: FieldWithConfidence;
}

const FieldCard = ({ label, field }: FieldCardProps) => (
  <div className="bg-secondary rounded-md p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-foreground truncate">{field.value || "—"}</p>
      <ConfidenceBadge confidence={field.confidence} />
    </div>
  </div>
);

export default FieldCard;
