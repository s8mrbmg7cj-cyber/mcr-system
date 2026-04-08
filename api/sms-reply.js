// api/sms-reply.js
// Twilio webhook - fires when someone replies to your auto-text
// Set in Twilio: Phone Number → "A message comes in" → Webhook → this URL

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "text/xml");

  if (req.method !== "POST") {
    return res.status(405).send("<Response></Response>");
  }

  const from    = req.body?.From || "";
  const body    = req.body?.Body || "";
  const to      = req.body?.To   || "";

  console.log("=== SMS REPLY ===");
  console.log("From:", from, "| Message:", body);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  // Save reply to Supabase
  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Find the lead by caller number
      const { data: lead } = await supabase
        .from("leads")
        .select("id, client_id")
        .eq("caller_number", from)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lead) {
        // Save inbound message
        await supabase.from("messages").insert({
          lead_id: lead.id,
          client_id: lead.client_id,
          direction: "inbound",
          body: body,
          is_auto: false,
        });

        // Update lead status to replied
        await supabase.from("leads")
          .update({ status: "replied", updated_at: new Date().toISOString() })
          .eq("id", lead.id);

        console.log("SUPABASE: reply saved for lead", lead.id);
      }
    } catch (err) {
      console.log("SUPABASE ERROR:", err.message);
    }
  }

  // Email notification of reply
  if (resendKey && notifyEmail) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Missed Call Rescue <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `💬 Lead Replied: ${from}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;">
            <div style="background:#22d382;color:#0d1422;padding:7px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px;">💬 Lead Replied</div>
            <h2 style="color:#fff;margin:0 0 16px;">Someone replied to your auto-text!</h2>
            <p style="color:rgba(240,244,255,0.6);margin-bottom:8px;">From: <strong style="color:#fff;">${from}</strong></p>
            <div style="background:rgba(34,211,130,0.08);border:1px solid rgba(34,211,130,0.2);border-radius:8px;padding:16px;margin-top:16px;font-size:15px;color:#fff;">"${body}"</div>
            <p style="color:rgba(240,244,255,0.4);font-size:12px;margin-top:16px;">Log in to your dashboard to respond and close the job.</p>
          </div>
        `,
      });
      console.log("EMAIL: reply notification sent");
    } catch (err) {
      console.log("EMAIL ERROR:", err.message);
    }
  }

  // Empty TwiML response - don't auto-reply to replies
  res.send("<Response></Response>");
}
