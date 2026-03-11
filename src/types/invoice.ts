export interface FieldWithConfidence<T = string> {
  value: T;
  confidence: number;
}

export interface ChargeLineItem {
  description: FieldWithConfidence;
  amount_usd: FieldWithConfidence;
  exchange_rate: FieldWithConfidence;
  amount_inr: FieldWithConfidence;
  tax_type: FieldWithConfidence;
  tax_rate: FieldWithConfidence;
}

export interface InvoiceData {
  invoice_number: FieldWithConfidence;
  invoice_date: FieldWithConfidence;
  invoice_type: FieldWithConfidence;
  due_date: FieldWithConfidence;
  payment_terms: FieldWithConfidence;
  carrier_name: FieldWithConfidence;
  carrier_gstin: FieldWithConfidence;
  customer_name: FieldWithConfidence;
  customer_gstin: FieldWithConfidence;
  customer_pan: FieldWithConfidence;
  shipper: FieldWithConfidence;
  consignee: FieldWithConfidence;
  origin: FieldWithConfidence;
  destination: FieldWithConfidence;
  etd: FieldWithConfidence;
  eta: FieldWithConfidence;
  ocean_bill_of_lading: FieldWithConfidence;
  house_bill_of_lading: FieldWithConfidence;
  shipment_number: FieldWithConfidence;
  container_numbers: FieldWithConfidence;
  goods_description: FieldWithConfidence;
  weight_kg: FieldWithConfidence;
  volume_m3: FieldWithConfidence;
  subtotal_inr: FieldWithConfidence;
  total_tax_inr: FieldWithConfidence;
  total_amount_inr: FieldWithConfidence;
  charge_line_items: ChargeLineItem[];
}

export type ExtractionStatus = 'auto-processed' | 'review' | 'human-review';

export function getOverallConfidence(data: InvoiceData): number {
  const fields = Object.entries(data).filter(([k]) => k !== 'charge_line_items');
  const confidences = fields.map(([, v]) => (v as FieldWithConfidence).confidence);
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

export function getExtractionStatus(confidence: number): ExtractionStatus {
  if (confidence >= 95) return 'auto-processed';
  if (confidence >= 70) return 'review';
  return 'human-review';
}
