// api/follow-up.js
// Called by a Vercel cron job to send follow-up texts
// Cron: runs every hour, checks for leads needing follow-up

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  // Verify cron secret so only Vercel can trigger this
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const accountSid    = process.env.TWILIO_ACCOUNT_SID;
  const authToken     = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber  = process.env.TWILIO_PHONE_NUMBER;
  const followUpMsg   = process.env.FOLLOW_UP_MSG ||
    "Just checking in — are you still looking to book? We have spots available this week!";

  if (!accountSid || !authToken || !twilioNumber) {
    return res.status(200).json({ skipped: true, reason: "Twilio not configured" });
  }

  // In production this would query your database for leads
  // that received auto-text 2+ hours ago with no reply
  // For now this endpoint is ready to connect to your data layer

  console.log("FOLLOW-UP: cron job ran");

  return res.status(200).json({ success: true, message: "Follow-up check complete" });
}
