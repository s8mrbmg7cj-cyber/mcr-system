// api/send-sms.js
// Send a manual SMS from the dashboard

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).json({ success: true });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, message, leadId } = req.body || {};

  if (!to || !message) {
    return res.status(400).json({ error: "Missing to or message" });
  }

  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;

  if (!accountSid || !authToken || !twilioNumber) {
    return res.status(500).json({ error: "Twilio not configured" });
  }

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: twilioNumber,
      to: to,
    });

    console.log("SMS: sent to", to);

    // Save to messages table
    if (supabaseUrl && supabaseKey && leadId) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from("messages").insert({
        lead_id: leadId,
        direction: "outbound",
        body: message,
        is_auto: false,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.log("SMS ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
