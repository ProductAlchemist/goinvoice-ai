import type { InvoiceData } from "@/types/invoice";
import { getOverallConfidence, getExtractionStatus } from "@/types/invoice";
import StatusBanner from "./StatusBanner";
import FieldCard from "./FieldCard";
import ConfidenceBadge from "./ConfidenceBadge";
import { ChevronDown, Copy, Check } from "lucide-react";
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
  onReset: () => void;
}

const InvoiceDashboard = ({ data, onReset }: InvoiceDashboardProps) => {
  const [limOpen, setLimOpen] = useState(false);
  const [showConfidence, setShowConfidence] = useState(false);
  const { copied: pageCopied, copy: copyPage } = useCopy();
  const overall = getOverallConfidence(data);

  const subtotal = parseFloat(data.subtotal_inr.value) || 0;
  const tax = parseFloat(data.total_tax_inr.value) || 0;
  const total = parseFloat(data.total_amount_inr.value) || 0;
  const mathValid = !subtotal || !total || Math.abs(subtotal + tax - total) < 0.01;
  // Math failure silently pulls status to review minimum
  const effectiveConfidence = !mathValid ? Math.min(overall, 89) : overall;
  const status = getExtractionStatus(effectiveConfidence);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Extraction Results</h2>
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

      {/* Upload another — prominent, separated from header actions */}
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-muted-foreground font-medium">Description</th>
                <th className="py-2 pr-4 text-muted-foreground font-medium">Amount USD</th>
                <th className="py-2 pr-4 text-muted-foreground font-medium">Exchange Rate</th>
                <th className="py-2 pr-4 text-muted-foreground font-medium">Amount INR</th>
                <th className="py-2 pr-4 text-muted-foreground font-medium">Tax Type</th>
                <th className="py-2 text-muted-foreground font-medium">Tax Rate</th>
              </tr>
            </thead>
            <tbody>
              {data.charge_line_items.map((item, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      {item.description.value}
                      {showConfidence && <ConfidenceBadge confidence={item.description.confidence} />}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      {item.amount_usd.value}
                      {showConfidence && <ConfidenceBadge confidence={item.amount_usd.confidence} />}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      {item.exchange_rate.value}
                      {showConfidence && <ConfidenceBadge confidence={item.exchange_rate.confidence} />}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      {item.amount_inr.value}
                      {showConfidence && <ConfidenceBadge confidence={item.amount_inr.confidence} />}
                    </div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      {item.tax_type.value}
                      {showConfidence && <ConfidenceBadge confidence={item.tax_type.confidence} />}
                    </div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">
                      {item.tax_rate.value}
                      {showConfidence && <ConfidenceBadge confidence={item.tax_rate.confidence} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 mt-6">
        {[
          { label: "Subtotal INR", value: data.subtotal_inr.value },
          { label: "Total Tax INR", value: data.total_tax_inr.value },
          { label: "Total Amount INR", value: data.total_amount_inr.value },
        ].map((t) => (
          <div key={t.label} className="bg-primary text-primary-foreground rounded-lg p-4 text-center">
            <p className="text-xs opacity-80">{t.label}</p>
            <p className="text-lg font-bold">{t.value || "—"}</p>
          </div>
        ))}
      </div>

      {/* Limitations */}
      <div className="mt-8 border border-border rounded-lg">
        <button
          onClick={() => setLimOpen(!limOpen)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
        >
          Model Limitations & Production Recommendation
          <ChevronDown className={`w-4 h-4 transition-transform ${limOpen ? "rotate-180" : ""}`} />
        </button>
        {limOpen && (
          <div className="px-4 pb-4 text-sm text-muted-foreground space-y-3">
            <p>
              Gemini is a general-purpose LLM. While it performs well on structured extraction, it may hallucinate values or miss fields in complex layouts. For production workloads, we recommend <strong>Google Document AI Invoice Parser</strong>.
            </p>
            <table className="w-full text-xs border border-border rounded">
              <thead>
                <tr className="bg-secondary">
                  <th className="p-2 text-left">Tier</th>
                  <th className="p-2 text-left">Tool</th>
                  <th className="p-2 text-left">Use Case</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="p-2">1 (Primary)</td>
                  <td className="p-2">Google Document AI Invoice Parser</td>
                  <td className="p-2">Production extraction with high accuracy</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-2">2 (Fallback)</td>
                  <td className="p-2">Gemini Vision (this tool)</td>
                  <td className="p-2">Unsupported formats or second opinion</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="p-2">3 (Manual)</td>
                  <td className="p-2">Human Review Queue</td>
                  <td className="p-2">Low-confidence or flagged invoices</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
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
