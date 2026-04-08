// api/missed-call.js
// Twilio webhook - fires when a call is missed
// Set in Twilio: Phone Number → "A call comes in" → Webhook → this URL

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/xml");

  if (req.method !== "POST") {
    return res.status(405).send("<Response></Response>");
  }

  const callerNumber  = req.body?.From || req.body?.Caller || "";
  const businessNumber = req.body?.To  || req.body?.Called || "";

  console.log("=== MISSED CALL ===");
  console.log("From:", callerNumber, "| To:", businessNumber);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  const missedMsg   = process.env.MISSED_CALL_MSG ||
    "Hey! Sorry we missed your call. What kind of service were you looking for? We'd love to help!";
  const notifyPhone  = process.env.NOTIFY_PHONE;
  const resendKey    = process.env.RESEND_API_KEY;
  const notifyEmail  = process.env.NOTIFY_EMAIL;
  const forwardTo    = process.env.FORWARD_TO_NUMBER;

  let leadId = null;

  // Save lead to Supabase
  if (supabaseUrl && supabaseKey && callerNumber) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find client by Twilio number
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("twilio_number", twilioNumber)
        .single();

      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
          client_id: client?.id || null,
          caller_number: callerNumber,
          status: "new",
          auto_text_sent: false,
        })
        .select()
        .single();

      if (error) console.log("SUPABASE ERROR:", error.message);
      else {
        leadId = lead.id;
        console.log("SUPABASE: lead saved — ID:", leadId);
      }
    } catch (err) {
      console.log("SUPABASE ERROR:", err.message);
    }
  }

  // Send auto-text to caller via Twilio
  if (accountSid && authToken && twilioNumber && callerNumber) {
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(accountSid, authToken);

      await client.messages.create({
        body: missedMsg,
        from: twilioNumber,
        to: callerNumber,
      });
      console.log("AUTO-TEXT: sent to", callerNumber);

      // Update lead as auto-text sent
      if (supabaseUrl && supabaseKey && leadId) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("leads").update({ auto_text_sent: true, status: "texted" }).eq("id", leadId);

        // Save message to messages table
        await supabase.from("messages").insert({
          lead_id: leadId,
          direction: "outbound",
          body: missedMsg,
          is_auto: true,
        });
      }

      // Notify owner by SMS
      if (notifyPhone) {
        await client.messages.create({
          body: `📵 Missed call from ${callerNumber} — auto-text sent. Check your dashboard.`,
          from: twilioNumber,
          to: notifyPhone,
        });
        console.log("OWNER SMS: sent");
      }

    } catch (err) {
      console.log("TWILIO ERROR:", err.message);
    }
  }

  // Send email notification
  if (resendKey && notifyEmail) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Missed Call Rescue <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `📵 Missed Call from ${callerNumber}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;">
            <div style="background:#ff4d4d;color:#fff;padding:7px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px;">📵 Missed Call</div>
            <h2 style="color:#fff;margin:0 0 16px;">Auto-Text Sent</h2>
            <p style="color:rgba(240,244,255,0.6);margin-bottom:8px;">Caller: <strong style="color:#fff;">${callerNumber}</strong></p>
            <p style="color:rgba(240,244,255,0.6);margin-bottom:20px;">Auto-text sent instantly. Log in to follow up.</p>
            <div style="background:rgba(45,126,248,0.1);border:1px solid rgba(45,126,248,0.2);border-radius:8px;padding:14px;font-size:13px;color:rgba(240,244,255,0.5);">Message: "${missedMsg}"</div>
          </div>
        `,
      });
      console.log("EMAIL: sent");
    } catch (err) {
      console.log("EMAIL ERROR:", err.message);
    }
  }

  // TwiML response
  if (forwardTo) {
    res.send(`<Response><Dial timeout="20">${forwardTo}</Dial></Response>`);
  } else {
    res.send(`<Response><Say>Thanks for calling. We missed your call but sent you a text and will be in touch shortly!</Say></Response>`);
  }
}
