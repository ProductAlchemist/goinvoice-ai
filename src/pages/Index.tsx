import { useState, useEffect, useRef } from "react";
import HeaderBar from "@/components/HeaderBar";
import UploadArea from "@/components/UploadArea";
import InvoiceDashboard from "@/components/InvoiceDashboard";
import { extractInvoice } from "@/lib/gemini";
import type { InvoiceData } from "@/types/invoice";
import { toast } from "sonner";

const STAGES = [
  { at: 0,  message: "Uploading invoice…" },
  { at: 12, message: "Reading document…" },
  { at: 35, message: "Extracting fields…" },
  { at: 60, message: "Validating data…" },
  { at: 85, message: "Almost done…" },
];

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<InvoiceData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      setProgressMsg(STAGES[0].message);
      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + (prev < 30 ? 3 : prev < 60 ? 2 : prev < 85 ? 1 : 0.3);
          const capped = Math.min(next, 92);
          const stage = [...STAGES].reverse().find((s) => capped >= s.at);
          if (stage) setProgressMsg(stage.message);
          return capped;
        });
      }, 400);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (progress > 0) {
        setProgress(100);
        setProgressMsg("Done!");
        setTimeout(() => setProgress(0), 800);
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLoading]);

  const handleExtract = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const data = await extractInvoice("", base64);
      setResult(data);
      toast.success("Invoice extracted successfully!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderBar />
      {result ? (
        <InvoiceDashboard data={result} onReset={handleReset} />
      ) : (
        <div className="max-w-2xl mx-auto px-4">
          {isLoading && (
            <div className="mt-8 space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{progressMsg}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div
                  className="bg-accent h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground pt-1">
                Please do not refresh or close this page
              </p>
            </div>
          )}
          <UploadArea
            onFileSelected={setFile}
            isLoading={isLoading}
            onExtract={handleExtract}
            hasFile={!!file}
            fileName={file?.name ?? null}
          />
        </div>
      )}
    </div>
  );
};

export default Index;
