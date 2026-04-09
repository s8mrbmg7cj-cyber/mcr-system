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

  const from = normalizePhone(req.body?.From || "");
  const body = req.body?.Body || "";

  console.log("=== SMS REPLY ===");
  console.log("From:", from, "| Message:", body);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SECRET_KEY;
  const resendKey   = process.env.RESEND_API_KEY;
  const notifyEmail = process.env.NOTIFY_EMAIL;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: lead } = await supabase
        .from("leads")
        .select("id, client_id")
        .eq("caller_number", from)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (lead) {
        await supabase.from("messages").insert({
          lead_id: lead.id,
          client_id: lead.client_id,
          direction: "inbound",
          body: body,
          is_auto: false,
        });
        await supabase.from("leads")
          .update({ status: "replied", updated_at: new Date().toISOString() })
          .eq("id", lead.id);
        console.log("SUPABASE: reply saved");
      }
    } catch (err) {
      console.log("SUPABASE ERROR:", err.message);
    }
  }

  if (resendKey && notifyEmail) {
    try {
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Missed Call Rescue <onboarding@resend.dev>",
        to: notifyEmail,
        subject: `💬 Lead Replied: ${from}`,
        html: `<div style="font-family:sans-serif;max-width:480px;background:#0d1422;color:#f0f4ff;padding:32px;border-radius:12px;"><div style="background:#22d382;color:#0d1422;padding:7px 14px;border-radius:6px;display:inline-block;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px;">💬 Lead Replied</div><h2 style="color:#fff;margin:0 0 16px;">Someone replied!</h2><p style="color:rgba(240,244,255,0.6);">From: <strong style="color:#fff;">${from}</strong></p><div style="background:rgba(34,211,130,0.08);border:1px solid rgba(34,211,130,0.2);border-radius:8px;padding:16px;margin-top:16px;font-size:15px;color:#fff;">"${body}"</div></div>`,
      });
      console.log("EMAIL: reply notification sent");
    } catch (err) {
      console.log("EMAIL ERROR:", err.message);
    }
  }

  return res.status(200).send("<Response></Response>");
}
