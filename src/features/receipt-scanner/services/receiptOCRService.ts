import * as ImageManipulator from 'expo-image-manipulator';

export interface ReceiptData {
  description: string | null;
  amount: string | null;
  date: string | null;
}

export async function extractReceiptData(
  imageUri: string,
  // mimeType / preloadedBase64 are kept for call-site compat but are no longer
  // needed — ImageManipulator normalises everything to JPEG.
  _mimeType?: string | null,
  _preloadedBase64?: string | null,
): Promise<ReceiptData> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Anthropic API key not configured. Set EXPO_PUBLIC_ANTHROPIC_API_KEY in your .env file.');
  }

  // Resize to max 1024 px wide, compress to ~70 % quality, output as JPEG.
  // • Keeps decoded size well below Anthropic's 3.75 MB limit.
  // • Works with file://, ph:// (iOS Photos) and content:// (Android) URIs.
  // • base64: true returns the data directly — no separate file-system read.
  const processed = await ImageManipulator.manipulateAsync(
    imageUri,
    [{ resize: { width: 1024 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );

  const base64 = processed.base64;
  if (!base64) {
    throw new Error('Failed to process image for OCR.');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extract the following from this receipt and return ONLY a JSON object, no other text:
{
  "description": "the merchant or store name (e.g. 'SM Supermarket', 'Jollibee')",
  "amount": "the total amount as a number string without currency symbols (e.g. '1250.00')",
  "date": "the receipt date in YYYY-MM-DD format (e.g. '2026-02-27')"
}
If a value cannot be determined, use null.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OCR request failed: ${error}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text ?? '';

  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleaned) as ReceiptData;
    return {
      description: parsed.description ?? null,
      amount: parsed.amount ?? null,
      date: parsed.date ?? null,
    };
  } catch {
    return { description: null, amount: null, date: null };
  }
}
