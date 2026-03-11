import { useState } from "react";
import HeaderBar from "@/components/HeaderBar";
import UploadArea from "@/components/UploadArea";
import InvoiceDashboard from "@/components/InvoiceDashboard";
import { extractInvoice } from "@/lib/gemini";
import type { InvoiceData } from "@/types/invoice";
import { toast } from "sonner";

const API_KEY_STORAGE = "goinvoice_gemini_key";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InvoiceData | null>(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || "");

  const handleExtract = async () => {
    if (!file) return;
    if (!apiKey.trim()) {
      toast.error("Please enter your Gemini API key first.");
      return;
    }
    localStorage.setItem(API_KEY_STORAGE, apiKey);
    setIsLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const data = await extractInvoice(apiKey, base64);
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
          {/* API Key Input */}
          <div className="mt-8">
            <label className="block text-sm font-medium text-foreground mb-1">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Get a key at{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Google AI Studio
              </a>
            </p>
          </div>
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
