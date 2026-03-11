import type { ExtractionStatus } from "@/types/invoice";
import { Eye, EyeOff } from "lucide-react";

interface StatusBannerProps {
  status: ExtractionStatus;
  confidence: number;
  showConfidence: boolean;
  onToggleConfidence: () => void;
}

const StatusBanner = ({ status, confidence, showConfidence, onToggleConfidence }: StatusBannerProps) => {
  const config = {
    "auto-processed": {
      bg: "bg-green-50 border border-green-200",
      text: "text-green-800",
      label: "✓ Looks good — all fields extracted with high confidence",
      desc: `Overall confidence: ${confidence.toFixed(1)}%`,
    },
    review: {
      bg: "bg-amber-50 border border-amber-200",
      text: "text-amber-800",
      label: "A few fields may need a quick manual check",
      desc: `Overall confidence: ${confidence.toFixed(1)}% — toggle confidence scores to see which fields to verify`,
    },
    "human-review": {
      bg: "bg-red-50 border border-red-200",
      text: "text-red-800",
      label: "Manual review recommended before processing",
      desc: `Overall confidence: ${confidence.toFixed(1)}% — please verify extracted values against the original invoice`,
    },
  }[status];

  return (
    <div className={`${config.bg} ${config.text} px-5 py-3 rounded-lg mb-4 flex items-center justify-between gap-4`}>
      <div>
        <p className="font-medium text-sm">{config.label}</p>
        <p className="text-xs opacity-80 mt-0.5">{config.desc}</p>
      </div>
      <button
        onClick={onToggleConfidence}
        className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap opacity-70 hover:opacity-100 transition-opacity"
        title="Toggle confidence scores"
      >
        {showConfidence ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        {showConfidence ? "Hide scores" : "Show scores"}
      </button>
    </div>
  );
};

export default StatusBanner;
