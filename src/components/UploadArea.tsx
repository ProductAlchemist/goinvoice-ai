import { useCallback, useState } from "react";
import { Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  onExtract: () => void;
  hasFile: boolean;
  fileName: string | null;
}

const UploadArea = ({ onFileSelected, isLoading, onExtract, hasFile, fileName }: UploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file?.type === "application/pdf") onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        {hasFile ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-primary" />
            <p className="font-medium text-foreground">{fileName}</p>
            <label className="text-sm text-accent cursor-pointer hover:underline">
              Change file
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-3 cursor-pointer">
            <Upload className="w-12 h-12 text-muted-foreground" />
            <p className="font-medium text-foreground">Drag & drop your PDF invoice here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
          </label>
        )}
      </div>
      <Button
        onClick={onExtract}
        disabled={!hasFile || isLoading}
        className="w-full mt-6 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 text-base"
      >
        {isLoading ? "Extracting…" : "Extract Invoice Data"}
      </Button>
    </div>
  );
};

export default UploadArea;
