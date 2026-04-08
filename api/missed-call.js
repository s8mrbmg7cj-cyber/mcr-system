// api/missed-call.js
// Twilio webhook — fires when a call is missed
// Set this URL in your Twilio number's "A call comes in" webhook
// URL: https://your-vercel-url.vercel.app/api/missed-call

export default async function handler(req, res) {

  // Twilio sends form data not JSON
  res.setHeader("Content-Type", "text/xml");

  if (req.method !== "POST") {
    return res.status(405).send("<Response></Response>");
  }

  const callerNumber = req.body?.From || req.body?.Caller || "";
  const businessNumber = req.body?.To || req.body?.Called || "";

  console.log("=== MISSED CALL ===");
  console.log("From:", callerNumber);
  console.log("To:", businessNumber);

  // Pull env vars
  const accountSid   = process.env.TWILIO_ACCOUNT_SID;
  const authToken    = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const missedMsg    = process.env.MISSED_CALL_MSG ||
    "Hey! Sorry we missed your call. What kind of service were you looking for? We'd love to help!";
  const notifyNumber = process.env.NOTIFY_PHONE;
  const resendKey    = process.env.RESEND_API_KEY;
  const notifyEmail  = process.env.NOTIFY_EMAIL;

  // Send auto-text to caller
  if (accountSid && authToken && twilioNumber && callerNumber) {
    try {
      const { Twilio } = await import("twilio");
      const client = new Twilio(accountSid, authToken);

      await client.messages.create({
        body: missedMsg,
        from: twilioNumber,
        to: callerNumber,
      });

      console.log("AUTO-TEXT: sent to", callerNumber);

      // Notify business owner by SMS
      if (notifyNumber) {
        await client.messages.create({
          body: `📵 Missed call from ${callerNumber} — auto-text sent. Log in to follow up.`,
          from: twilioNumber,
          to: notifyNumber,
        });
        console.log("OWNER NOTIFY: sent to", notifyNumber);
      }

      // Schedule follow-up check via separate mechanism
      // (Vercel cron or Twilio TaskRouter handles this)

    } catch (err) {
      console.log("TWILIO ERROR:", err.message);
    }
  } else {
    console.log("TWILIO: env vars missing — skipping auto-text");
  }

  // Notify via email
  if (resendKey && notifyEmail && callerNumber) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Missed Call Rescue <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `📵 Missed Call from ${callerNumber}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;">
            <div style="background:#ff4d4d;color:#fff;padding:7px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px;">📵 Missed Call</div>
            <h2 style="color:#fff;margin:0 0 16px;">Someone Called — Auto-Text Sent</h2>
            <p style="color:rgba(240,244,255,0.6);margin-bottom:8px;">Caller: <strong style="color:#fff;">${callerNumber}</strong></p>
            <p style="color:rgba(240,244,255,0.6);margin-bottom:20px;">Auto-text was sent instantly. Log in to your dashboard to follow up.</p>
            <div style="background:rgba(45,126,248,0.1);border:1px solid rgba(45,126,248,0.2);border-radius:8px;padding:14px;font-size:13px;color:rgba(240,244,255,0.5);">
              Message sent: "${missedMsg}"
            </div>
          </div>
        `,
      });
      console.log("EMAIL NOTIFY: sent");
    } catch (err) {
      console.log("EMAIL ERROR:", err.message);
    }
  }

  // Return TwiML — forward call or play message
  const forwardTo = process.env.FORWARD_TO_NUMBER;
  if (forwardTo) {
    res.send(`<Response><Dial>${forwardTo}</Dial></Response>`);
  } else {
    res.send(`<Response>
      <Say>Thanks for calling. We missed your call but have sent you a text. We'll be in touch shortly!</Say>
    </Response>`);
  }
}
