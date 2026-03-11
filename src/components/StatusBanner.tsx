import type { ExtractionStatus } from "@/types/invoice";

interface StatusBannerProps {
  status: ExtractionStatus;
  confidence: number;
}

const StatusBanner = ({ status, confidence }: StatusBannerProps) => {
  const config = {
    "auto-processed": { bg: "bg-success", text: "✅ Auto-processed", desc: `Overall confidence: ${confidence.toFixed(1)}%` },
    review: { bg: "bg-warning", text: "⚠️ Review flagged fields", desc: `Overall confidence: ${confidence.toFixed(1)}%` },
    "human-review": { bg: "bg-destructive", text: "❌ Full human review required", desc: `Overall confidence: ${confidence.toFixed(1)}%` },
  }[status];

  return (
    <div className={`${config.bg} text-primary-foreground px-6 py-3 rounded-lg mb-6`}>
      <p className="font-semibold">{config.text}</p>
      <p className="text-sm opacity-90">{config.desc}</p>
    </div>
  );
};

export default StatusBanner;
