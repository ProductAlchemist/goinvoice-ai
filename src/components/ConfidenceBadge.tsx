interface ConfidenceBadgeProps {
  confidence: number;
}

const ConfidenceBadge = ({ confidence }: ConfidenceBadgeProps) => {
  const color =
    confidence >= 85
      ? "bg-success text-success-foreground"
      : confidence >= 70
      ? "bg-warning text-warning-foreground"
      : "bg-destructive text-destructive-foreground";

  return (
    <span className={`inline-block text-xs font-semibold px-1.5 py-0.5 rounded ${color}`}>
      {confidence}%
    </span>
  );
};

export default ConfidenceBadge;
