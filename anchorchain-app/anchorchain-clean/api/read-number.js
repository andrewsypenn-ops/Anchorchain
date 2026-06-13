// Vercel serverless function — keeps the Anthropic API key secret on the server.
// The app sends an image here; this function calls Claude and returns just the number.

export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" }
  }
};

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

    // SCORECARD MODE: read the whole report and return structured table data
    if (kind === "scorecard") {
      const scorecardPrompt = `This is a photo of a dental practice Rain Makers performance report. It may be rotated, angled, or have screen glare — orient it correctly first. The report has up to 4 sections, each a table of team members with their stats. Read ALL sections present in the image.

The 4 possible sections are:
1. "Scheduling - Follow Up Tasks" — columns: Team Member, Total $, $ Per Attempt, Attempts, Contacted, %, Successes, %
2. "Other" — columns: Team Member, Attempts, Contacted, %, Completed, %
3. "Unscheduled Broken Appointment" — columns: Team Member, Schedule $, $ Per Attempt, Attempts, Contacted, %, Completed, %, Patients
4. "Unscheduled Treatment" — columns: Team Member, Total $, $ Per Attempt, Attempts, Contacted, %, Successes, %

For each section found, read every team member row (do NOT include the Total/Avg summary row). Reply with ONLY valid JSON in this exact format, no other text:
{"sched":[["Name","$260","$87","3","3","100%","2","67%"]],"other":[["Name","1","1","100%","1","100%"]],"broken":[["Name","$3,131","$1,044","3","3","100%","2","67%","2"]],"unsched":[["Name","$6,485","$540","12","7","58%","7","100%"]]}

Each array is the rows for that section, and each row is an array of cell values matching that section's columns in order. If a section is not visible in the image, use an empty array []. Include dollar signs and % signs as shown. If you cannot read the report at all, reply: {"error":"unreadable"}`;

      const scRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
              { type: "text", text: scorecardPrompt }
            ]
          }]
        })
      });
      const scData = await scRes.json();
      if (scData.error) {
        return res.status(200).json({ sections: null, debug: scData.error.message || JSON.stringify(scData.error) });
      }
      let scText = (scData.content || []).map(c => c.text || "").join("").trim();
      // Strip code fences if present
      scText = scText.replace(/```json|```/g, "").trim();
      try {
        const parsed = JSON.parse(scText);
        if (parsed.error) return res.status(200).json({ sections: null, debug: parsed.error });
        return res.status(200).json({ sections: parsed });
      } catch (e) {
        return res.status(200).json({ sections: null, debug: "Could not parse table. AI said: " + scText.slice(0, 200) });
      }
    }

    const promptText = kind === "scheduled"
      ? "This is a photo of a dental practice 'Unscheduled Treatment' report with a table of team members and dollar amounts. The image may be rotated, taken at an angle, or have screen glare. First mentally orient it correctly. Find the 'Total $' figure on the 'Total/Avg.' summary row at the bottom of the table (the grand total of all team members' dollars, for example $21,330). Read it carefully digit by digit. Reply with ONLY that number — no dollar sign, no words, no commas. For example for $21,330 reply: 21330. If you cannot read it, reply: NONE"
      : "This is a photo of a dental practice scheduling report. The image may be rotated, taken at an angle, or have screen glare. First, mentally orient the image correctly. Then find the line labeled 'Scheduled:' (it appears in a summary box, near 'Month Goal', 'Variance', and 'Production'). Read the number directly after 'Scheduled:' very carefully, digit by digit. This is a 6-digit monthly production number. Reply with ONLY that number — no dollar sign, no words, no commas. For example, if it shows 'Scheduled: 341,732' reply with: 341732. Double-check each digit before answering. If you truly cannot read it, reply: NONE";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
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

    // If Anthropic returned an error, pass it back so we can see it
    if (data.error) {
      return res.status(200).json({ number: null, debug: data.error.message || JSON.stringify(data.error) });
    }

    const text = (data.content || []).map(c => c.text || "").join("").trim();
    const num = text.replace(/[^0-9.]/g, "");

    return res.status(200).json({ number: (text === "NONE" || !num) ? null : num, debug: text });
  } catch (e) {
    return res.status(200).json({ number: null, debug: "Function error: " + (e.message || String(e)) });
  }
}
