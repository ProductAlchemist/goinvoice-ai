import { useState } from "react";
import { Copy, Check, Pencil } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import type { FieldWithConfidence } from "@/types/invoice";

interface FieldCardProps {
  label: string;
  field: FieldWithConfidence;
  showConfidence?: boolean;
  displayValue?: string;       // overridden value if edited
  isEdited?: boolean;
  onEdit?: (newValue: string) => void;
}

const FieldCard = ({ label, field, showConfidence = false, displayValue, isEdited, onEdit }: FieldCardProps) => {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editInput, setEditInput] = useState("");

  const currentValue = displayValue !== undefined ? displayValue : field.value;
  const missing = !currentValue;
  const unavailable = missing && field.confidence === 0 && !isEdited;
  const needsCheck = missing && field.confidence > 0 && !isEdited;

  const handleCopy = () => {
    if (!currentValue) return;
    navigator.clipboard.writeText(currentValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startEdit = () => {
    setEditInput(currentValue ?? "");
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    if (editInput !== currentValue) onEdit?.(editInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div className="bg-secondary rounded-md p-3 group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs text-muted-foreground">{label}</p>
          {isEdited && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded">edited</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && !editing && (
            <button onClick={startEdit} className="text-muted-foreground hover:text-foreground" title={`Edit ${label}`}>
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {!missing && !editing && (
            <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground" title={`Copy ${label}`}>
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <input
            autoFocus
            value={editInput}
            onChange={e => setEditInput(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="text-sm font-medium text-foreground bg-background border border-ring rounded px-2 py-0.5 w-full focus:outline-none"
          />
        ) : (
          <>
            {unavailable && <p className="text-xs text-muted-foreground italic">Data unavailable</p>}
            {needsCheck && <p className="text-xs text-amber-600 font-medium">Manual check needed</p>}
            {!missing && <p className="text-sm font-medium text-foreground truncate">{currentValue}</p>}
            {showConfidence && !missing && <ConfidenceBadge confidence={field.confidence} />}
          </>
        )}
      </div>
    </div>
  );
};

export default FieldCard;
