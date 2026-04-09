import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

function normalizePhone(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  if (digits.length === 10) return "+1" + digits;
  return "+" + digits;
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/xml");

  if (req.method !== "POST") {
    return res.status(405).send("<Response></Response>");
  }

  const callStatus   = req.body?.CallStatus || "";
  const callerRaw    = req.body?.From || req.body?.Caller || "";
  const twilioNumber = req.body?.To  || req.body?.Called  || "";
  const callerNumber = normalizePhone(callerRaw);

  console.log("=== INCOMING CALL EVENT ===");
  console.log("CallStatus:", callStatus);
  console.log("From:", callerNumber);
  console.log("To:", twilioNumber);

  const missedStatuses = ["no-answer", "busy", "failed", "canceled"];
  if (!missedStatuses.includes(callStatus)) {
    console.log("SKIPPED: not a missed call — status was:", callStatus);
    return res.status(200).send("<Response></Response>");
  }

  if (!callerNumber) {
    console.log("SKIPPED: no caller number");
    return res.status(200).send("<Response></Response>");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const accountSid  = process.env.TWILIO_ACCOUNT_SID;
  const authToken   = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber  = normalizePhone(process.env.TWILIO_PHONE_NUMBER);
  const missedMsg   = process.env.MISSED_CALL_MSG || "Hey! Sorry we missed your call. What kind of service were you looking for? We'd love to help!";
  const notifyPhone = process.env.NOTIFY_PHONE;
  const resendKey   = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;
  const forwardTo   = process.env.FORWARD_TO_NUMBER;

  // Check blocked numbers
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: blocked } = await supabase
        .from("blocked_numbers")
        .select("phone, label")
        .eq("phone", callerNumber)
        .single();

      if (blocked) {
        console.log(`SKIPPED: ${callerNumber} is in ignore list — label: ${blocked.label || "none"}`);
        return res.status(200).send("<Response></Response>");
      }
    } catch (err) {
      console.log("Blocked check:", err.message.includes("no rows") ? "not blocked" : err.message);
    }
  }

  // Save lead to Supabase
  let leadId = null;
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: lead, error } = await supabase
        .from("leads")
        .insert({
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

  // Send auto-text
  if (accountSid && authToken && fromNumber && callerNumber) {
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(accountSid, authToken);

      await client.messages.create({
        body: missedMsg,
        from: fromNumber,
        to: callerNumber,
      });

      console.log("AUTO-TEXT SENT to", callerNumber);

      if (supabaseUrl && supabaseKey && leadId) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from("leads")
          .update({ auto_text_sent: true, status: "texted" })
          .eq("id", leadId);
        await supabase.from("messages").insert({
          lead_id: leadId,
          direction: "outbound",
          body: missedMsg,
          is_auto: true,
        });
      }

      if (notifyPhone) {
        await client.messages.create({
          body: `📵 Missed call from ${callerNumber} — auto-text sent. Check your dashboard.`,
          from: fromNumber,
          to: normalizePhone(notifyPhone),
        });
        console.log("OWNER SMS: sent to", notifyPhone);
      }

    } catch (err) {
      console.log("TWILIO ERROR:", err.message);
    }
  } else {
    console.log("TWILIO: env vars missing — skipping auto-text");
  }

  // Email notification
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
            <p style="color:rgba(240,244,255,0.6);">Auto-text sent instantly. Log in to follow up.</p>
          </div>
        `,
      });
      console.log("EMAIL: sent");
    } catch (err) {
      console.log("EMAIL ERROR:", err.message);
    }
  }

  if (forwardTo) {
    return res.status(200).send(`<Response><Dial timeout="20">${normalizePhone(forwardTo)}</Dial></Response>`);
  }
  return res.status(200).send(`<Response><Say>Thanks for calling. We missed your call but sent you a text and will be in touch shortly!</Say></Response>`);
}
