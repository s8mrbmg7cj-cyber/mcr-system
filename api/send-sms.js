export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).json({ success: true });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: "Missing to or message" });

  const accountSid   = process.env.TWILIO_ACCOUNT_SID;
  const authToken    = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioNumber) {
    return res.status(500).json({ error: "Twilio not configured" });
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);
    await client.messages.create({ body: message, from: twilioNumber, to });
    console.log("SMS: sent to", to);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("SMS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
