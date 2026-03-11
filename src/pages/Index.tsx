import { useState } from "react";
import HeaderBar from "@/components/HeaderBar";
import UploadArea from "@/components/UploadArea";
import InvoiceDashboard from "@/components/InvoiceDashboard";
import { extractInvoice } from "@/lib/gemini";
import type { InvoiceData } from "@/types/invoice";
import { toast } from "sonner";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvoiceData | null>(null);

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
