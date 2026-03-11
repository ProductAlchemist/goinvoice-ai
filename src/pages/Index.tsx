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

const SailingAnimation = ({ message }: { message: string }) => (
  <div className="mt-10 space-y-4">
    <div className="relative w-full h-32 overflow-hidden rounded-xl select-none">
      <style>{`
        @keyframes sail {
          0%   { left: -160px; }
          100% { left: calc(100% + 160px); }
        }
        @keyframes wave-sail {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ship-sailing { animation: sail 6s linear infinite; position: absolute; bottom: 20px; }
        .wave-sailing  { animation: wave-sail 3s linear infinite; }
      `}</style>

      {/* Sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 to-blue-200" />

      {/* Sailing ship */}
      <div className="ship-sailing">
        <div style={{ display: "flex", gap: 2, marginBottom: 2, justifyContent: "center" }}>
          <div style={{ width: 20, height: 11, background: "#f87171", borderRadius: 2, border: "1px solid #ef4444" }} />
          <div style={{ width: 20, height: 11, background: "#3b82f6", borderRadius: 2, border: "1px solid #2563eb" }} />
          <div style={{ width: 20, height: 11, background: "#facc15", borderRadius: 2, border: "1px solid #eab308" }} />
        </div>
        <div style={{ display: "flex", gap: 2, marginBottom: 2, justifyContent: "center", marginLeft: 8 }}>
          <div style={{ width: 20, height: 11, background: "#fb923c", borderRadius: 2, border: "1px solid #f97316" }} />
          <div style={{ width: 20, height: 11, background: "#22c55e", borderRadius: 2, border: "1px solid #16a34a" }} />
        </div>
        <div style={{ width: 76, height: 6, background: "#cbd5e1", borderRadius: 2, margin: "0 auto" }} />
        <div style={{ width: 68, height: 14, background: "#334155", borderBottomLeftRadius: 8, borderBottomRightRadius: 8, margin: "0 auto", clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)" }} />
      </div>

      {/* Ocean */}
      <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
        <svg className="wave-sailing absolute bottom-0" width="200%" height="40" viewBox="0 0 1440 40" preserveAspectRatio="none">
          <path d="M0,20 C120,6 240,34 360,20 C480,6 600,34 720,20 C840,6 960,34 1080,20 C1200,6 1320,34 1440,20 L1440,40 L0,40 Z" fill="#3b82f6" fillOpacity="0.35" />
          <path d="M0,28 C100,14 220,38 360,28 C500,18 580,38 720,28 C860,18 940,38 1080,28 C1220,18 1340,38 1440,28 L1440,40 L0,40 Z" fill="#2563eb" fillOpacity="0.45" />
        </svg>
      </div>
    </div>

    <div className="text-center space-y-1">
      <p className="text-sm font-medium text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">Please do not refresh or close this page</p>
    </div>
  </div>
);

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<InvoiceData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    if (isLoading) {
      progressRef.current = 0;
      setProgressMsg(STAGES[0].message);
      intervalRef.current = setInterval(() => {
        const prev = progressRef.current;
        const next = Math.min(prev + (prev < 30 ? 3 : prev < 60 ? 2 : prev < 85 ? 1 : 0.3), 92);
        progressRef.current = next;
        const stage = [...STAGES].reverse().find((s) => next >= s.at);
        if (stage) setProgressMsg(stage.message);
      }, 400);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      progressRef.current = 0;
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
        <InvoiceDashboard data={result} fileName={file?.name} file={file} onReset={handleReset} />
      ) : (
        <div className="max-w-2xl mx-auto px-4">
          {isLoading ? (
            <SailingAnimation message={progressMsg} />
          ) : (
            <UploadArea
              onFileSelected={setFile}
              isLoading={isLoading}
              onExtract={handleExtract}
              hasFile={!!file}
              fileName={file?.name ?? null}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
