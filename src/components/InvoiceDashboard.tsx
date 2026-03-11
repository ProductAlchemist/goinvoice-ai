import type { InvoiceData } from "@/types/invoice";
import { getOverallConfidence, getExtractionStatus } from "@/types/invoice";
import StatusBanner from "./StatusBanner";
import FieldCard from "./FieldCard";
import ConfidenceBadge from "./ConfidenceBadge";
import { Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
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
  onReset: () => void;
}

const InvoiceDashboard = ({ data, fileName, onReset }: InvoiceDashboardProps) => {
  const [showConfidence, setShowConfidence] = useState(false);
  const { copied: pageCopied, copy: copyPage } = useCopy();
  const overall = getOverallConfidence(data);

  const subtotal = parseFloat(data.subtotal_inr.value) || 0;
  const tax = parseFloat(data.total_tax_inr.value) || 0;
  const total = parseFloat(data.total_amount_inr.value) || 0;
  const mathValid = !subtotal || !total || Math.abs(subtotal + tax - total) < 0.01;
  const effectiveConfidence = !mathValid ? Math.min(overall, 89) : overall;
  const status = getExtractionStatus(effectiveConfidence);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Extraction Results</h2>
          {fileName && (
            <p className="text-xs text-muted-foreground mt-0.5">{fileName}</p>
          )}
        </div>
        <button
          onClick={() => copyPage(JSON.stringify(data, null, 2))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          title="Copy full extraction as JSON"
        >
          {pageCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          {pageCopied ? "Copied!" : "Copy all as JSON"}
        </button>
      </div>

      <StatusBanner
        status={status}
        confidence={overall}
        showConfidence={showConfidence}
        onToggleConfidence={() => setShowConfidence(!showConfidence)}
      />

      {/* Upload another — top */}
      <div className="mt-4 mb-2">
        <Button onClick={onReset} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
          ↑ Upload another invoice
        </Button>
      </div>

      {/* Invoice Header */}
      <Section title="Invoice Header" copyData={{ invoice_number: data.invoice_number, invoice_date: data.invoice_date, invoice_type: data.invoice_type, due_date: data.due_date, payment_terms: data.payment_terms, carrier_name: data.carrier_name, carrier_gstin: data.carrier_gstin, shipment_number: data.shipment_number }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {/* Parties */}
      <Section title="Parties" copyData={{ customer_name: data.customer_name, customer_gstin: data.customer_gstin, customer_pan: data.customer_pan, shipper: data.shipper, consignee: data.consignee }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <FieldCard label="Customer Name" field={data.customer_name} showConfidence={showConfidence} />
            <FieldCard label="Customer GSTIN" field={data.customer_gstin} showConfidence={showConfidence} />
            <FieldCard label="Customer PAN" field={data.customer_pan} showConfidence={showConfidence} />
          </div>
          <div className="space-y-3">
            <FieldCard label="Shipper" field={data.shipper} showConfidence={showConfidence} />
            <FieldCard label="Consignee" field={data.consignee} showConfidence={showConfidence} />
          </div>
        </div>
      </Section>

      {/* Shipment Details */}
      <Section title="Shipment Details" copyData={{ origin: data.origin, destination: data.destination, etd: data.etd, eta: data.eta, ocean_bill_of_lading: data.ocean_bill_of_lading, house_bill_of_lading: data.house_bill_of_lading, goods_description: data.goods_description, weight_kg: data.weight_kg, volume_m3: data.volume_m3, container_numbers: data.container_numbers }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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

      {/* Charge Line Items */}
      <Section title="Charge Line Items" copyData={{ charge_line_items: data.charge_line_items }}>
        {data.charge_line_items.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">No charge line items found in this invoice.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <p className="text-xs text-muted-foreground px-3 pt-2 pb-1">← Scroll to see all columns</p>
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-left bg-secondary">
                  <th className="py-2 px-3 text-muted-foreground font-medium">Description</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Amount USD</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Exchange Rate</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Amount INR</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Tax Type</th>
                  <th className="py-2 px-3 text-muted-foreground font-medium">Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.charge_line_items.map((item, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.description.value || <span className="text-xs text-muted-foreground italic">—</span>}
                        {showConfidence && <ConfidenceBadge confidence={item.description.confidence} />}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.amount_usd.value || <span className="text-xs text-muted-foreground italic">—</span>}
                        {showConfidence && <ConfidenceBadge confidence={item.amount_usd.confidence} />}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.exchange_rate.value || <span className="text-xs text-muted-foreground italic">—</span>}
                        {showConfidence && <ConfidenceBadge confidence={item.exchange_rate.confidence} />}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.amount_inr.value || <span className="text-xs text-muted-foreground italic">—</span>}
                        {showConfidence && <ConfidenceBadge confidence={item.amount_inr.confidence} />}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.tax_type.value || <span className="text-xs text-muted-foreground italic">—</span>}
                        {showConfidence && <ConfidenceBadge confidence={item.tax_type.confidence} />}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        {item.tax_rate.value || <span className="text-xs text-muted-foreground italic">—</span>}
                        {showConfidence && <ConfidenceBadge confidence={item.tax_rate.confidence} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Totals */}
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

      {/* Upload another — bottom */}
      <div className="mt-10 pt-6 border-t border-border flex justify-center">
        <Button onClick={onReset} variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8">
          ↑ Upload another invoice
        </Button>
      </div>
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
