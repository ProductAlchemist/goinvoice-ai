import { useCallback, useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  onExtract: () => void;
  hasFile: boolean;
  fileName: string | null;
}

const ShippingAnimation = () => (
  <div className="relative w-full h-36 overflow-hidden select-none">
    <style>{`
      @keyframes bob {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
      }
      @keyframes wave-scroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      @keyframes cloud-drift {
        0% { transform: translateX(0); }
        100% { transform: translateX(40px); }
      }
      @keyframes doc-float {
        0%, 100% { transform: translateY(0px) rotate(-2deg); }
        50% { transform: translateY(-6px) rotate(1deg); }
      }
      .ship-bob { animation: bob 3s ease-in-out infinite; }
      .wave-anim { animation: wave-scroll 4s linear infinite; }
      .cloud-anim { animation: cloud-drift 6s ease-in-out infinite alternate; }
      .doc-float { animation: doc-float 4s ease-in-out infinite; }
    `}</style>

    {/* Sky */}
    <div className="absolute inset-0 bg-gradient-to-b from-sky-50 to-blue-100 rounded-lg" />

    {/* Clouds */}
    <div className="cloud-anim absolute top-3 left-8 opacity-70">
      <div className="flex gap-0">
        <div className="w-8 h-4 bg-white rounded-full" />
        <div className="w-6 h-5 bg-white rounded-full -ml-2 -mt-1" />
        <div className="w-7 h-4 bg-white rounded-full -ml-1" />
      </div>
    </div>
    <div className="cloud-anim absolute top-5 right-16 opacity-50" style={{ animationDelay: "2s" }}>
      <div className="flex">
        <div className="w-6 h-3 bg-white rounded-full" />
        <div className="w-5 h-4 bg-white rounded-full -ml-1 -mt-1" />
        <div className="w-5 h-3 bg-white rounded-full -ml-1" />
      </div>
    </div>

    {/* Floating document (invoice) */}
    <div className="doc-float absolute top-4 right-10 opacity-80" style={{ animationDelay: "1s" }}>
      <div className="w-8 h-10 bg-white border border-blue-200 rounded shadow-sm flex flex-col p-1 gap-0.5">
        <div className="h-0.5 bg-blue-200 rounded w-full" />
        <div className="h-0.5 bg-blue-100 rounded w-4/5" />
        <div className="h-0.5 bg-blue-200 rounded w-full" />
        <div className="h-0.5 bg-blue-100 rounded w-3/5" />
        <div className="h-0.5 bg-blue-200 rounded w-full" />
        <div className="h-0.5 bg-blue-100 rounded w-4/5" />
      </div>
    </div>

    {/* Ship group */}
    <div className="ship-bob absolute bottom-10 left-1/2 -translate-x-1/2">
      {/* Containers */}
      <div className="flex gap-0.5 mb-0.5 justify-center">
        <div className="w-7 h-4 bg-red-400 rounded-sm border border-red-500" />
        <div className="w-7 h-4 bg-blue-500 rounded-sm border border-blue-600" />
        <div className="w-7 h-4 bg-yellow-400 rounded-sm border border-yellow-500" />
        <div className="w-7 h-4 bg-green-500 rounded-sm border border-green-600" />
      </div>
      <div className="flex gap-0.5 mb-0.5 justify-center ml-3">
        <div className="w-7 h-4 bg-orange-400 rounded-sm border border-orange-500" />
        <div className="w-7 h-4 bg-red-500 rounded-sm border border-red-600" />
        <div className="w-7 h-4 bg-blue-400 rounded-sm border border-blue-500" />
      </div>
      {/* Deck */}
      <div className="w-36 h-2 bg-slate-300 rounded-sm mx-auto" />
      {/* Hull */}
      <div className="w-32 h-5 bg-slate-700 rounded-b-lg mx-auto" style={{ clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)" }} />
    </div>

    {/* Ocean with scrolling waves */}
    <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden">
      <svg className="wave-anim absolute bottom-0" width="200%" height="48" viewBox="0 0 1440 48" preserveAspectRatio="none">
        <path d="M0,24 C120,8 240,40 360,24 C480,8 600,40 720,24 C840,8 960,40 1080,24 C1200,8 1320,40 1440,24 L1440,48 L0,48 Z" fill="#3b82f6" fillOpacity="0.3" />
        <path d="M0,32 C100,16 220,44 360,32 C500,20 580,44 720,32 C860,20 940,44 1080,32 C1220,20 1340,44 1440,32 L1440,48 L0,48 Z" fill="#2563eb" fillOpacity="0.4" />
      </svg>
    </div>
  </div>
);

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
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
          isDragging ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        {hasFile ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <FileText className="w-12 h-12 text-accent" />
            <p className="font-medium text-foreground">{fileName}</p>
            <label className="text-sm text-accent cursor-pointer hover:underline">
              Change file
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
            </label>
          </div>
        ) : (
          <label className="cursor-pointer block">
            <ShippingAnimation />
            <div className="px-6 pb-6 pt-3 text-center">
              <p className="font-semibold text-foreground">Drop your freight invoice here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse — PDF only</p>
            </div>
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileInput} />
          </label>
        )}
      </div>

      <Button
        onClick={() => {
          if (!hasFile) {
            toast.info("Upload an invoice first — drop a PDF or click the area above.");
            return;
          }
          onExtract();
        }}
        disabled={isLoading}
        className={`w-full mt-5 font-semibold py-6 text-base transition-colors ${
          hasFile
            ? "bg-accent hover:bg-accent/90 text-accent-foreground"
            : "bg-muted text-muted-foreground cursor-pointer"
        }`}
      >
        {isLoading ? "Extracting…" : "Extract Invoice Data"}
      </Button>
    </div>
  );
};

export default UploadArea;
