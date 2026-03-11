import type { InvoiceData } from "@/types/invoice";
import { getOverallConfidence, getExtractionStatus } from "@/types/invoice";
import StatusBanner from "./StatusBanner";
import FieldCard from "./FieldCard";
import ConfidenceBadge from "./ConfidenceBadge";
import { CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface InvoiceDashboardProps {
  data: InvoiceData;
  onReset: () => void;
}

const InvoiceDashboard = ({ data, onReset }: InvoiceDashboardProps) => {
  const [limOpen, setLimOpen] = useState(false);
  const overall = getOverallConfidence(data);
  const status = getExtractionStatus(overall);

  const subtotal = parseFloat(data.subtotal_inr.value) || 0;
  const tax = parseFloat(data.total_tax_inr.value) || 0;
  const total = parseFloat(data.total_amount_inr.value) || 0;
  const mathValid = Math.abs(subtotal + tax - total) < 0.01;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-foreground">Extraction Results</h2>
        <button onClick={onReset} className="text-sm text-accent hover:underline font-medium">
          ← Upload another
        </button>
      </div>

      <StatusBanner status={status} confidence={overall} />

      {/* Invoice Header */}
      <Section title="Invoice Header">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FieldCard label="Invoice Number" field={data.invoice_number} />
          <FieldCard label="Invoice Date" field={data.invoice_date} />
          <FieldCard label="Invoice Type" field={data.invoice_type} />
          <FieldCard label="Due Date" field={data.due_date} />
          <FieldCard label="Payment Terms" field={data.payment_terms} />
          <FieldCard label="Carrier Name" field={data.carrier_name} />
          <FieldCard label="Carrier GSTIN" field={data.carrier_gstin} />
          <FieldCard label="Shipment Number" field={data.shipment_number} />
        </div>
      </Section>

      {/* Parties */}
      <Section title="Parties">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <FieldCard label="Customer Name" field={data.customer_name} />
            <FieldCard label="Customer GSTIN" field={data.customer_gstin} />
            <FieldCard label="Customer PAN" field={data.customer_pan} />
          </div>
          <div className="space-y-3">
            <FieldCard label="Shipper" field={data.shipper} />
            <FieldCard label="Consignee" field={data.consignee} />
          </div>
        </div>
      </Section>

      {/* Shipment Details */}
      <Section title="Shipment Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FieldCard label="Origin" field={data.origin} />
          <FieldCard label="Destination" field={data.destination} />
          <FieldCard label="ETD" field={data.etd} />
          <FieldCard label="ETA" field={data.eta} />
          <FieldCard label="Ocean Bill of Lading" field={data.ocean_bill_of_lading} />
          <FieldCard label="House Bill of Lading" field={data.house_bill_of_lading} />
          <FieldCard label="Goods Description" field={data.goods_description} />
          <FieldCard label="Weight (kg)" field={data.weight_kg} />
          <FieldCard label="Volume (m³)" field={data.volume_m3} />
          <FieldCard label="Container Numbers" field={data.container_numbers} />
        </div>
      </Section>

      {/* Charge Line Items */}
      <Section title="Charge Line Items">
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
                    <div className="flex items-center gap-1.5">{item.description.value} <ConfidenceBadge confidence={item.description.confidence} /></div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">{item.amount_usd.value} <ConfidenceBadge confidence={item.amount_usd.confidence} /></div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">{item.exchange_rate.value} <ConfidenceBadge confidence={item.exchange_rate.confidence} /></div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">{item.amount_inr.value} <ConfidenceBadge confidence={item.amount_inr.confidence} /></div>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">{item.tax_type.value} <ConfidenceBadge confidence={item.tax_type.confidence} /></div>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1.5">{item.tax_rate.value} <ConfidenceBadge confidence={item.tax_rate.confidence} /></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
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
        <div className="bg-primary text-primary-foreground rounded-lg p-4 text-center flex flex-col items-center justify-center">
          <p className="text-xs opacity-80">Math Validation</p>
          {mathValid ? (
            <CheckCircle className="w-6 h-6 text-green-300 mt-1" />
          ) : (
            <XCircle className="w-6 h-6 text-red-300 mt-1" />
          )}
        </div>
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

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-6">
    <h3 className="text-base font-semibold text-foreground mb-3 border-b border-border pb-2">{title}</h3>
    {children}
  </div>
);

export default InvoiceDashboard;
