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
    const summaryRows: string[][] = [
      ["Field", "Extracted Value", "Confidence (%)"],
      ["Invoice Number", v("invoice_number", data.invoice_number.value), String(data.invoice_number.confidence)],
      ["Invoice Date", v("invoice_date", data.invoice_date.value), String(data.invoice_date.confidence)],
      ["Invoice Type", v("invoice_type", data.invoice_type.value), String(data.invoice_type.confidence)],
      ["Due Date", v("due_date", data.due_date.value), String(data.due_date.confidence)],
      ["Payment Terms", v("payment_terms", data.payment_terms.value), String(data.payment_terms.confidence)],
      ["Carrier Name", v("carrier_name", data.carrier_name.value), String(data.carrier_name.confidence)],
      ["Carrier GSTIN", v("carrier_gstin", data.carrier_gstin.value), String(data.carrier_gstin.confidence)],
      ["Shipment Number", v("shipment_number", data.shipment_number.value), String(data.shipment_number.confidence)],
      ["Customer Name", v("customer_name", data.customer_name.value), String(data.customer_name.confidence)],
      ["Customer GSTIN", v("customer_gstin", data.customer_gstin.value), String(data.customer_gstin.confidence)],
      ["Customer PAN", v("customer_pan", data.customer_pan.value), String(data.customer_pan.confidence)],
      ["Shipper", v("shipper", data.shipper.value), String(data.shipper.confidence)],
      ["Consignee", v("consignee", data.consignee.value), String(data.consignee.confidence)],
      ["Origin", v("origin", data.origin.value), String(data.origin.confidence)],
      ["Destination", v("destination", data.destination.value), String(data.destination.confidence)],
      ["ETD", v("etd", data.etd.value), String(data.etd.confidence)],
      ["ETA", v("eta", data.eta.value), String(data.eta.confidence)],
      ["Ocean Bill of Lading", v("ocean_bill_of_lading", data.ocean_bill_of_lading.value), String(data.ocean_bill_of_lading.confidence)],
      ["House Bill of Lading", v("house_bill_of_lading", data.house_bill_of_lading.value), String(data.house_bill_of_lading.confidence)],
      ["Goods Description", v("goods_description", data.goods_description.value), String(data.goods_description.confidence)],
      ["Weight (kg)", v("weight_kg", data.weight_kg.value), String(data.weight_kg.confidence)],
      ["Volume (m³)", v("volume_m3", data.volume_m3.value), String(data.volume_m3.confidence)],
      ["Container Numbers", v("container_numbers", data.container_numbers.value), String(data.container_numbers.confidence)],
      ["Subtotal INR", v("subtotal_inr", data.subtotal_inr.value), String(data.subtotal_inr.confidence)],
      ["Total Tax INR", v("total_tax_inr", data.total_tax_inr.value), String(data.total_tax_inr.confidence)],
      ["Total Amount INR", v("total_amount_inr", data.total_amount_inr.value), String(data.total_amount_inr.confidence)],
    ];

    const lineItemRows: string[][] = [
      [],
      ["Charge Line Items"],
      ["Description", "Amount USD", "Exchange Rate", "Amount INR", "Tax Type", "Tax Rate"],
      ...data.charge_line_items.map(item => [
        item.description.value, item.amount_usd.value, item.exchange_rate.value,
        item.amount_inr.value, item.tax_type.value, item.tax_rate.value,
      ]),
    ];

    const auditRows: string[][] = auditLog.length > 0 ? [
      [],
      ["Edit Audit Trail"],
      ["Field", "Original Value", "Corrected Value", "Edited By", "Timestamp"],
      ...auditLog.map(e => [e.field, e.original, e.corrected, e.editedBy, e.timestamp]),
    ] : [];

    downloadCSV([...summaryRows, ...lineItemRows, ...auditRows], `${fileName ?? "invoice"}.csv`);
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
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">Extraction Results</h2>
              {fileName && <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>}
            </div>
            {file && (
              <button
                onClick={() => setSplitView(!splitView)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded border transition-colors ${
                  splitView
                    ? "border-border text-muted-foreground hover:text-foreground"
                    : "border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                }`}
                title={splitView ? "Exit split view" : "View original PDF"}
              >
                {splitView ? <LayoutList className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {splitView ? "Exit" : "View PDF"}
              </button>
            )}
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
