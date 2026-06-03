// Vercel serverless function — keeps the Anthropic API key secret on the server.
// The app sends an image here; this function calls Claude and returns just the number.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { imageBase64, mediaType, kind } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image provided" });
    }

    const promptText = "Look at this image of a dental practice report. Find the number that appears next to or after the word 'Scheduled'. This is the monthly scheduled production figure. Reply with ONLY that number — no dollar sign, no words, no commas. For example, if it shows 'Scheduled 281,904' reply with: 281904. If you can't find a number after 'Scheduled', reply: NONE";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
            { type: "text", text: promptText }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = (data.content || []).map(c => c.text || "").join("").trim();
    const num = text.replace(/[^0-9.]/g, "");

    return res.status(200).json({ number: (text === "NONE" || !num) ? null : num });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to read image" });
  }
}
