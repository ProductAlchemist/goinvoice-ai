import type { InvoiceData } from "@/types/invoice";

export async function extractInvoice(_apiKey: string, pdfBase64: string): Promise<InvoiceData> {
  const response = await fetch("/api/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pdfBase64 }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Extraction error (${response.status}): ${err}`);
  }

  return response.json() as Promise<InvoiceData>;
}
