import type { InvoiceData } from "@/types/invoice";
import { getOverallConfidence, getExtractionStatus } from "@/types/invoice";
import StatusBanner from "./StatusBanner";
import FieldCard from "./FieldCard";
import ConfidenceBadge from "./ConfidenceBadge";
import { Copy, Check, Columns2, LayoutList, FileText, Download } from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, []);
  return { copied, copy };
}

interface InvoiceDashboardProps {
  data: InvoiceData;
  fileName?: string;
  file?: File | null;
  onReset: () => void;
  userName?: string | null;
}

function downloadCSV(rows: string[][], filename: string) {
  const csv = rows.map(r => r.map(cell => `"${(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const InvoiceDashboard = ({ data, fileName, file, onReset, userName }: InvoiceDashboardProps) => {
  const [showConfidence, setShowConfidence] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const { copied: pageCopied, copy: copyPage } = useCopy();
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (file) {
      blobUrlRef.current = URL.createObjectURL(file);
    }
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [file]);
  const handleDownloadSummaryCSV = () => {
    const rows = [
      ["Field", "Extracted Value", "Confidence (%)"],
      ["Invoice Number", data.invoice_number.value, String(data.invoice_number.confidence)],
      ["Invoice Date", data.invoice_date.value, String(data.invoice_date.confidence)],
      ["Invoice Type", data.invoice_type.value, String(data.invoice_type.confidence)],
      ["Due Date", data.due_date.value, String(data.due_date.confidence)],
      ["Payment Terms", data.payment_terms.value, String(data.payment_terms.confidence)],
      ["Carrier Name", data.carrier_name.value, String(data.carrier_name.confidence)],
      ["Carrier GSTIN", data.carrier_gstin.value, String(data.carrier_gstin.confidence)],
      ["Shipment Number", data.shipment_number.value, String(data.shipment_number.confidence)],
      ["Customer Name", data.customer_name.value, String(data.customer_name.confidence)],
      ["Customer GSTIN", data.customer_gstin.value, String(data.customer_gstin.confidence)],
      ["Customer PAN", data.customer_pan.value, String(data.customer_pan.confidence)],
      ["Shipper", data.shipper.value, String(data.shipper.confidence)],
      ["Consignee", data.consignee.value, String(data.consignee.confidence)],
      ["Origin", data.origin.value, String(data.origin.confidence)],
      ["Destination", data.destination.value, String(data.destination.confidence)],
      ["ETD", data.etd.value, String(data.etd.confidence)],
      ["ETA", data.eta.value, String(data.eta.confidence)],
      ["Ocean Bill of Lading", data.ocean_bill_of_lading.value, String(data.ocean_bill_of_lading.confidence)],
      ["House Bill of Lading", data.house_bill_of_lading.value, String(data.house_bill_of_lading.confidence)],
      ["Goods Description", data.goods_description.value, String(data.goods_description.confidence)],
      ["Weight (kg)", data.weight_kg.value, String(data.weight_kg.confidence)],
      ["Volume (m³)", data.volume_m3.value, String(data.volume_m3.confidence)],
      ["Container Numbers", data.container_numbers.value, String(data.container_numbers.confidence)],
      ["Subtotal INR", data.subtotal_inr.value, String(data.subtotal_inr.confidence)],
      ["Total Tax INR", data.total_tax_inr.value, String(data.total_tax_inr.confidence)],
      ["Total Amount INR", data.total_amount_inr.value, String(data.total_amount_inr.confidence)],
    ];
    downloadCSV(rows, `${fileName ?? "invoice"}-summary.csv`);
  };

  const handleDownloadLineItemsCSV = () => {
    const rows = [
      ["Description", "Amount USD", "Exchange Rate", "Amount INR", "Tax Type", "Tax Rate"],
      ...data.charge_line_items.map(item => [
        item.description.value, item.amount_usd.value, item.exchange_rate.value,
        item.amount_inr.value, item.tax_type.value, item.tax_rate.value,
      ]),
    ];
    downloadCSV(rows, `${fileName ?? "invoice"}-line-items.csv`);
  };

  const overall = getOverallConfidence(data);

  const subtotal = parseFloat(data.subtotal_inr.value) || 0;
  const tax = parseFloat(data.total_tax_inr.value) || 0;
  const total = parseFloat(data.total_amount_inr.value) || 0;
  const mathValid = !subtotal || !total || Math.abs(subtotal + tax - total) < 0.01;
  const effectiveConfidence = !mathValid ? Math.min(overall, 89) : overall;
  const status = getExtractionStatus(effectiveConfidence);

  const resultsPanel = (
    <div>
      <StatusBanner
        status={status}
        confidence={overall}
        showConfidence={showConfidence}
        onToggleConfidence={() => setShowConfidence(!showConfidence)}
      />

      <div className="mt-4 mb-2">
        <Button onClick={onReset} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
          ↑ Upload another invoice
        </Button>
      </div>

      {/* Invoice Header */}
      <Section title="Invoice Header" copyData={{ invoice_number: data.invoice_number, invoice_date: data.invoice_date, invoice_type: data.invoice_type, due_date: data.due_date, payment_terms: data.payment_terms, carrier_name: data.carrier_name, carrier_gstin: data.carrier_gstin, shipment_number: data.shipment_number }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldCard label="Invoice Number" field={data.invoice_number} showConfidence={showConfidence} />
          <FieldCard label="Invoice Date" field={data.invoice_date} showConfidence={showConfidence} />
          <FieldCard label="Invoice Type" field={data.invoice_type} showConfidence={showConfidence} />
          <FieldCard label="Due Date" field={data.due_date} showConfidence={showConfidence} />
          <FieldCard label="Payment Terms" field={data.payment_terms} showConfidence={showConfidence} />
          <FieldCard label="Carrier Name" field={data.carrier_name} showConfidence={showConfidence} />
          <FieldCard label="Carrier GSTIN" field={data.carrier_gstin} showConfidence={showConfidence} />
          <FieldCard label="Shipment Number" field={data.shipment_number} showConfidence={showConfidence} />
        </div>
      </Section>

      <Section title="Parties" copyData={{ customer_name: data.customer_name, customer_gstin: data.customer_gstin, customer_pan: data.customer_pan, shipper: data.shipper, consignee: data.consignee }}>
        <div className="space-y-3">
          <FieldCard label="Customer Name" field={data.customer_name} showConfidence={showConfidence} />
          <FieldCard label="Customer GSTIN" field={data.customer_gstin} showConfidence={showConfidence} />
          <FieldCard label="Customer PAN" field={data.customer_pan} showConfidence={showConfidence} />
          <FieldCard label="Shipper" field={data.shipper} showConfidence={showConfidence} />
          <FieldCard label="Consignee" field={data.consignee} showConfidence={showConfidence} />
        </div>
      </Section>

      <Section title="Shipment Details" copyData={{ origin: data.origin, destination: data.destination, etd: data.etd, eta: data.eta, ocean_bill_of_lading: data.ocean_bill_of_lading, house_bill_of_lading: data.house_bill_of_lading, goods_description: data.goods_description, weight_kg: data.weight_kg, volume_m3: data.volume_m3, container_numbers: data.container_numbers }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FieldCard label="Origin" field={data.origin} showConfidence={showConfidence} />
          <FieldCard label="Destination" field={data.destination} showConfidence={showConfidence} />
          <FieldCard label="ETD" field={data.etd} showConfidence={showConfidence} />
          <FieldCard label="ETA" field={data.eta} showConfidence={showConfidence} />
          <FieldCard label="Ocean Bill of Lading" field={data.ocean_bill_of_lading} showConfidence={showConfidence} />
          <FieldCard label="House Bill of Lading" field={data.house_bill_of_lading} showConfidence={showConfidence} />
          <FieldCard label="Goods Description" field={data.goods_description} showConfidence={showConfidence} />
          <FieldCard label="Weight (kg)" field={data.weight_kg} showConfidence={showConfidence} />
          <FieldCard label="Volume (m³)" field={data.volume_m3} showConfidence={showConfidence} />
          <FieldCard label="Container Numbers" field={data.container_numbers} showConfidence={showConfidence} />
        </div>
      </Section>

      <Section title="Charge Line Items" copyData={{ charge_line_items: data.charge_line_items }}>
        {data.charge_line_items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">No charge line items found in this invoice.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <p className="text-xs text-muted-foreground px-3 pt-2 pb-1">← Scroll to see all columns</p>
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-border text-left bg-secondary">
                  <th className="py-2 px-3 text-muted-foreground font-medium">Description</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">USD</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Rate</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">INR</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Tax</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.charge_line_items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="py-2 px-3">{item.description.value || <span className="text-xs text-muted-foreground italic">—</span>}{showConfidence && <ConfidenceBadge confidence={item.description.confidence} />}</td>
                    <td className="py-2 px-3">{item.amount_usd.value || "—"}{showConfidence && <ConfidenceBadge confidence={item.amount_usd.confidence} />}</td>
                    <td className="py-2 px-3">{item.exchange_rate.value || "—"}{showConfidence && <ConfidenceBadge confidence={item.exchange_rate.confidence} />}</td>
                    <td className="py-2 px-3">{item.amount_inr.value || "—"}{showConfidence && <ConfidenceBadge confidence={item.amount_inr.confidence} />}</td>
                    <td className="py-2 px-3">{item.tax_type.value || "—"}{showConfidence && <ConfidenceBadge confidence={item.tax_type.confidence} />}</td>
                    <td className="py-2 px-3">{item.tax_rate.value || "—"}{showConfidence && <ConfidenceBadge confidence={item.tax_rate.confidence} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { label: "Subtotal INR", value: data.subtotal_inr.value },
          { label: "Total Tax INR", value: data.total_tax_inr.value },
          { label: "Total Amount INR", value: data.total_amount_inr.value },
        ].map((t) => (
          <div key={t.label} className="bg-secondary border border-border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{t.value || "—"}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-border flex justify-center">
        <Button onClick={onReset} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8">
          ↑ Upload another invoice
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header — always full width */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-8 pb-4">
        {/* Title row */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Extraction Results</h2>
            {fileName && <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copyPage(JSON.stringify(data, null, 2))}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {pageCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {pageCopied ? "Copied!" : "Copy JSON"}
            </button>
            <button
              onClick={handleDownloadSummaryCSV}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Download summary as CSV"
            >
              <Download className="w-4 h-4" />
              Summary CSV
            </button>
            <button
              onClick={handleDownloadLineItemsCSV}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Download line items as CSV"
            >
              <Download className="w-4 h-4" />
              Line items CSV
            </button>
          </div>
        </div>

        {/* View PDF — prominent action row */}
        {file && (
          <button
            onClick={() => setSplitView(!splitView)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 font-medium text-sm transition-colors ${
              splitView
                ? "border-border text-muted-foreground hover:border-accent hover:text-accent"
                : "border-accent text-accent hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {splitView ? <LayoutList className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            {splitView ? "Exit split view" : "View original PDF alongside extracted data"}
          </button>
        )}
      </div>

      {/* Body — split or full */}
      {splitView && blobUrlRef.current ? (
        <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 80px)" }}>
          <div className="w-1/2 border-r border-border">
            <iframe src={blobUrlRef.current} className="w-full h-full" title="Invoice PDF" />
          </div>
          <div className="w-1/2 overflow-y-auto px-4 py-2">
            {resultsPanel}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto w-full px-4 pb-8">
          {resultsPanel}
        </div>
      )}
    </div>
  );
};

const Section = ({ title, children, copyData }: { title: string; children: React.ReactNode; copyData?: object }) => {
  const { copied, copy } = useCopy();
  return (
    <div className="mt-6">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {copyData && (
          <button
            onClick={() => copy(JSON.stringify(copyData, null, 2))}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            title={`Copy ${title} as JSON`}
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy section"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default InvoiceDashboard;
