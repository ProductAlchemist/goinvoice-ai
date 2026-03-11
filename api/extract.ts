import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // MOCK MODE — remove once Gemini billing is enabled
  return res.status(200).json({
    invoice_number: { value: "INV-2024-00847", confidence: 98 },
    invoice_date: { value: "2024-11-15", confidence: 97 },
    invoice_type: { value: "Ocean Freight Invoice", confidence: 95 },
    due_date: { value: "2024-12-15", confidence: 94 },
    payment_terms: { value: "Net 30", confidence: 96 },
    carrier_name: { value: "Maersk Line India Pvt Ltd", confidence: 99 },
    carrier_gstin: { value: "27AABCM1234A1Z5", confidence: 91 },
    customer_name: { value: "Tata Steel Limited", confidence: 98 },
    customer_gstin: { value: "27AAACT2727Q1ZP", confidence: 93 },
    customer_pan: { value: "AAACT2727Q", confidence: 90 },
    shipper: { value: "Tata Steel Limited, Mumbai", confidence: 95 },
    consignee: { value: "Tata Steel GmbH, Hamburg", confidence: 94 },
    origin: { value: "Nhava Sheva (JNPT), India", confidence: 99 },
    destination: { value: "Hamburg, Germany", confidence: 99 },
    etd: { value: "2024-11-18", confidence: 92 },
    eta: { value: "2024-12-10", confidence: 88 },
    ocean_bill_of_lading: { value: "MAEU240847651", confidence: 97 },
    house_bill_of_lading: { value: "INBOM240011234", confidence: 95 },
    shipment_number: { value: "SHP-2024-4421", confidence: 96 },
    container_numbers: { value: "MSKU1234567, MSKU7654321", confidence: 94 },
    goods_description: { value: "Hot Rolled Steel Coils — HR Grade", confidence: 91 },
    weight_kg: { value: "24500", confidence: 89 },
    volume_m3: { value: "31.2", confidence: 72 },
    subtotal_inr: { value: "485000", confidence: 96 },
    total_tax_inr: { value: "87300", confidence: 95 },
    total_amount_inr: { value: "572300", confidence: 97 },
    charge_line_items: [
      {
        description: { value: "Ocean Freight", confidence: 98 },
        amount_usd: { value: "3200.00", confidence: 97 },
        exchange_rate: { value: "84.25", confidence: 96 },
        amount_inr: { value: "269600", confidence: 95 },
        tax_type: { value: "IGST", confidence: 98 },
        tax_rate: { value: "18%", confidence: 98 },
      },
      {
        description: { value: "Terminal Handling Charges", confidence: 95 },
        amount_usd: { value: "450.00", confidence: 93 },
        exchange_rate: { value: "84.25", confidence: 96 },
        amount_inr: { value: "37912", confidence: 92 },
        tax_type: { value: "IGST", confidence: 95 },
        tax_rate: { value: "18%", confidence: 95 },
      },
      {
        description: { value: "Documentation Fee", confidence: 97 },
        amount_usd: { value: "75.00", confidence: 96 },
        exchange_rate: { value: "84.25", confidence: 96 },
        amount_inr: { value: "6318", confidence: 94 },
        tax_type: { value: "IGST", confidence: 94 },
        tax_rate: { value: "18%", confidence: 94 },
      },
      {
        description: { value: "Fuel Surcharge (BAF)", confidence: 88 },
        amount_usd: { value: "2020.00", confidence: 85 },
        exchange_rate: { value: "84.25", confidence: 96 },
        amount_inr: { value: "170185", confidence: 84 },
        tax_type: { value: "IGST", confidence: 87 },
        tax_rate: { value: "18%", confidence: 87 },
      },
      {
        description: { value: "Port Congestion Surcharge", confidence: 61 },
        amount_usd: { value: "120.00", confidence: 58 },
        exchange_rate: { value: "84.25", confidence: 96 },
        amount_inr: { value: "10110", confidence: 57 },
        tax_type: { value: "", confidence: 0 },
        tax_rate: { value: "", confidence: 0 },
      },
    ],
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
  }

  const { pdfBase64 } = req.body as { pdfBase64: string };
  if (!pdfBase64) {
    return res.status(400).json({ error: "pdfBase64 is required" });
  }

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

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const geminiRes = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            { inline_data: { mime_type: "application/pdf", data: pdfBase64 } },
          ],
        },
      ],
      generationConfig: { temperature: 0, maxOutputTokens: 8192 },
    }),
  });

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    return res.status(geminiRes.status).json({ error: `Gemini error: ${err}` });
  }

  const result = await geminiRes.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return res.status(500).json({ error: "No response from Gemini" });
  }

  const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  return res.status(200).json(JSON.parse(cleaned));
}
