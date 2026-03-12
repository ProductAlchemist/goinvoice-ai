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

interface AuditEntry {
  field: string;
  original: string;
  corrected: string;
  editedBy: string;
  timestamp: string;
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
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const { copied: pageCopied, copy: copyPage } = useCopy();
  const blobUrlRef = useRef<string | null>(null);
  const extractionTimeRef = useRef<string>(new Date().toLocaleString());

  useEffect(() => {
    if (file) blobUrlRef.current = URL.createObjectURL(file);
    return () => { if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current); };
  }, [file]);

  const v = (key: string, original: string) => overrides[key] !== undefined ? overrides[key] : original;

  const handleEdit = (fieldKey: string, original: string, newValue: string) => {
    setOverrides(prev => ({ ...prev, [fieldKey]: newValue }));
    setAuditLog(prev => [...prev, {
      field: fieldKey,
      original,
      corrected: newValue,
      editedBy: userName ?? "Unknown",
      timestamp: new Date().toLocaleString(),
    }]);
  };

  const overall = getOverallConfidence(data);
  const subtotal = parseFloat(data.subtotal_inr.value) || 0;
  const tax = parseFloat(data.total_tax_inr.value) || 0;
  const total = parseFloat(data.total_amount_inr.value) || 0;
  const mathValid = !subtotal || !total || Math.abs(subtotal + tax - total) < 0.01;
  const effectiveConfidence = !mathValid ? Math.min(overall, 89) : overall;
  const status = getExtractionStatus(effectiveConfidence);

  const handleDownloadCSV = () => {
    // All invoice fields as columns (wide format)
    const FIELDS: Array<{ key: string; label: string; orig: string }> = [
      { key: "invoice_number", label: "invoice_number", orig: data.invoice_number.value },
      { key: "invoice_date", label: "invoice_date", orig: data.invoice_date.value },
      { key: "invoice_type", label: "invoice_type", orig: data.invoice_type.value },
      { key: "due_date", label: "due_date", orig: data.due_date.value },
      { key: "payment_terms", label: "payment_terms", orig: data.payment_terms.value },
      { key: "carrier_name", label: "carrier_name", orig: data.carrier_name.value },
      { key: "carrier_gstin", label: "carrier_gstin", orig: data.carrier_gstin.value },
      { key: "shipment_number", label: "shipment_number", orig: data.shipment_number.value },
      { key: "customer_name", label: "customer_name", orig: data.customer_name.value },
      { key: "customer_gstin", label: "customer_gstin", orig: data.customer_gstin.value },
      { key: "customer_pan", label: "customer_pan", orig: data.customer_pan.value },
      { key: "shipper", label: "shipper", orig: data.shipper.value },
      { key: "consignee", label: "consignee", orig: data.consignee.value },
      { key: "origin", label: "origin", orig: data.origin.value },
      { key: "destination", label: "destination", orig: data.destination.value },
      { key: "etd", label: "etd", orig: data.etd.value },
      { key: "eta", label: "eta", orig: data.eta.value },
      { key: "ocean_bill_of_lading", label: "ocean_bill_of_lading", orig: data.ocean_bill_of_lading.value },
      { key: "house_bill_of_lading", label: "house_bill_of_lading", orig: data.house_bill_of_lading.value },
      { key: "goods_description", label: "goods_description", orig: data.goods_description.value },
      { key: "weight_kg", label: "weight_kg", orig: data.weight_kg.value },
      { key: "volume_m3", label: "volume_m3", orig: data.volume_m3.value },
      { key: "container_numbers", label: "container_numbers", orig: data.container_numbers.value },
      { key: "subtotal_inr", label: "subtotal_inr", orig: data.subtotal_inr.value },
      { key: "total_tax_inr", label: "total_tax_inr", orig: data.total_tax_inr.value },
      { key: "total_amount_inr", label: "total_amount_inr", orig: data.total_amount_inr.value },
    ];

    const headers = [...FIELDS.map(f => f.label), "action_type", "actioned_by", "actioned_at"];

    // Row 1: original OCR extraction
    const ocrValues: Record<string, string> = {};
    FIELDS.forEach(f => { ocrValues[f.key] = f.orig; });

    const buildRow = (vals: Record<string, string>, actionType: string, actionedBy: string, actionedAt: string) =>
      [...FIELDS.map(f => vals[f.key] ?? ""), actionType, actionedBy, actionedAt];

    const rows: string[][] = [headers, buildRow(ocrValues, "ocr", "system", extractionTimeRef.current)];

    // Subsequent rows: replay each edit, show full state at that moment
    const running = { ...ocrValues };
    for (const entry of auditLog) {
      running[entry.field] = entry.corrected;
      rows.push(buildRow({ ...running }, "manual", entry.editedBy, entry.timestamp));
    }

    downloadCSV(rows, `${fileName ?? "invoice"}.csv`);
  };

  const fc = (key: string, field: { value: string; confidence: number }, label: string) => (
    <FieldCard
      label={label}
      field={field}
      showConfidence={showConfidence}
      displayValue={overrides[key]}
      isEdited={key in overrides}
      onEdit={(val) => handleEdit(key, field.value, val)}
    />
  );

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

      <Section title="Invoice Header" copyData={{ invoice_number: data.invoice_number, invoice_date: data.invoice_date, invoice_type: data.invoice_type, due_date: data.due_date, payment_terms: data.payment_terms, carrier_name: data.carrier_name, carrier_gstin: data.carrier_gstin, shipment_number: data.shipment_number }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fc("invoice_number", data.invoice_number, "Invoice Number")}
          {fc("invoice_date", data.invoice_date, "Invoice Date")}
          {fc("invoice_type", data.invoice_type, "Invoice Type")}
          {fc("due_date", data.due_date, "Due Date")}
          {fc("payment_terms", data.payment_terms, "Payment Terms")}
          {fc("carrier_name", data.carrier_name, "Carrier Name")}
          {fc("carrier_gstin", data.carrier_gstin, "Carrier GSTIN")}
          {fc("shipment_number", data.shipment_number, "Shipment Number")}
        </div>
      </Section>

      <Section title="Parties" copyData={{ customer_name: data.customer_name, customer_gstin: data.customer_gstin, customer_pan: data.customer_pan, shipper: data.shipper, consignee: data.consignee }}>
        <div className="space-y-3">
          {fc("customer_name", data.customer_name, "Customer Name")}
          {fc("customer_gstin", data.customer_gstin, "Customer GSTIN")}
          {fc("customer_pan", data.customer_pan, "Customer PAN")}
          {fc("shipper", data.shipper, "Shipper")}
          {fc("consignee", data.consignee, "Consignee")}
        </div>
      </Section>

      <Section title="Shipment Details" copyData={{ origin: data.origin, destination: data.destination, etd: data.etd, eta: data.eta, ocean_bill_of_lading: data.ocean_bill_of_lading, house_bill_of_lading: data.house_bill_of_lading, goods_description: data.goods_description, weight_kg: data.weight_kg, volume_m3: data.volume_m3, container_numbers: data.container_numbers }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fc("origin", data.origin, "Origin")}
          {fc("destination", data.destination, "Destination")}
          {fc("etd", data.etd, "ETD")}
          {fc("eta", data.eta, "ETA")}
          {fc("ocean_bill_of_lading", data.ocean_bill_of_lading, "Ocean Bill of Lading")}
          {fc("house_bill_of_lading", data.house_bill_of_lading, "House Bill of Lading")}
          {fc("goods_description", data.goods_description, "Goods Description")}
          {fc("weight_kg", data.weight_kg, "Weight (kg)")}
          {fc("volume_m3", data.volume_m3, "Volume (m³)")}
          {fc("container_numbers", data.container_numbers, "Container Numbers")}
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
          { key: "subtotal_inr", label: "Subtotal INR", field: data.subtotal_inr },
          { key: "total_tax_inr", label: "Total Tax INR", field: data.total_tax_inr },
          { key: "total_amount_inr", label: "Total Amount INR", field: data.total_amount_inr },
        ].map((t) => (
          <div key={t.label} className="bg-secondary border border-border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground">{t.label}</p>
            <p className="text-lg font-bold text-foreground mt-1">{v(t.key, t.field.value) || "—"}</p>
          </div>
        ))}
      </div>

      {/* Audit trail */}
      {auditLog.length > 0 && (
        <div className="mt-8">
          <div className="border-b border-border pb-2 mb-3">
            <h3 className="text-base font-semibold text-foreground">Edit Audit Trail</h3>
            <p className="text-xs text-muted-foreground mt-0.5">All manual corrections made to this extraction</p>
          </div>
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary text-left">
                  <th className="py-2 px-3 text-muted-foreground font-medium">Field</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Original</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Corrected</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Edited by</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 px-3 text-muted-foreground">{entry.field}</td>
                    <td className="py-2 px-3 line-through text-muted-foreground">{entry.original || "—"}</td>
                    <td className="py-2 px-3 font-medium text-foreground">{entry.corrected}</td>
                    <td className="py-2 px-3 text-accent font-medium">{entry.editedBy}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{entry.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-10 pt-6 border-t border-border flex justify-center">
        <Button onClick={onReset} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8">
          ↑ Upload another invoice
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-8 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground">Extraction Results</h2>
            <div className="flex items-center gap-2 mt-0.5">
              {fileName && <p className="text-xs text-muted-foreground">{fileName}</p>}
              {file && fileName && <span className="text-xs text-muted-foreground">·</span>}
              {file && (
                <button
                  onClick={() => setSplitView(!splitView)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline transition-colors"
                  title={splitView ? "Exit split view" : "View original PDF"}
                >
                  {splitView ? <LayoutList className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  {splitView ? "Exit PDF view" : "View PDF"}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              title="Download as CSV"
            >
              <Download className="w-4 h-4" />
              Download CSV
            </button>
            <button
              onClick={() => copyPage(JSON.stringify(data, null, 2))}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {pageCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {pageCopied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
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
