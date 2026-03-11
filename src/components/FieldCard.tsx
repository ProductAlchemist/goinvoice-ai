import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import type { FieldWithConfidence } from "@/types/invoice";

interface FieldCardProps {
  label: string;
  field: FieldWithConfidence;
}

const FieldCard = ({ label, field }: FieldCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!field.value) return;
    navigator.clipboard.writeText(field.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-secondary rounded-md p-3 group">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          title={`Copy ${label}`}
        >
          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground truncate">{field.value || "—"}</p>
        <ConfidenceBadge confidence={field.confidence} />
      </div>
    </div>
  );
};

export default FieldCard;
