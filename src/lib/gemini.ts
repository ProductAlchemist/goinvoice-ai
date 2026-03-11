import type { InvoiceData } from "@/types/invoice";

const EXTRACTION_PROMPT = `You are a freight invoice data extraction AI. Extract the following fields from this invoice PDF. Return a JSON object where each field (except charge_line_items) is an object with "value" (string) and "confidence" (number 0-100).

Fields to extract:
- invoice_number, invoice_date, invoice_type, due_date, payment_terms
- carrier_name, carrier_gstin
- customer_name, customer_gstin, customer_pan
- shipper, consignee
- origin, destination, etd, eta
- ocean_bill_of_lading, house_bill_of_lading
- shipment_number, container_numbers
- goods_description, weight_kg, volume_m3
- subtotal_inr, total_tax_inr, total_amount_inr
- charge_line_items: array of objects, each with fields: description, amount_usd, exchange_rate, amount_inr, tax_type, tax_rate — each sub-field is {value, confidence}

If a field is not found, set value to "" and confidence to 0.
Return ONLY valid JSON, no markdown fences.`;

export async function extractInvoice(apiKey: string, pdfBase64: string): Promise<InvoiceData> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: pdfBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");

  // Strip markdown fences if present
  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned) as InvoiceData;
}
