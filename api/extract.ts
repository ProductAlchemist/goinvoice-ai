import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
