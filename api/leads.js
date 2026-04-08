// api/leads.js
// Returns real leads from Supabase for the dashboard

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json");

  if (req.method === "OPTIONS") return res.status(200).json({ success: true });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
  );

  // UPDATE lead status
  if (req.method === "POST") {
    const { id, status } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing lead id" });
    const { error } = await supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  // GET leads
  try {
    const { data: leads, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: submissions } = await supabase
      .from("form_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    // Stats
    const stats = {
      totalMissed: leads?.length || 0,
      recovered: leads?.filter(l => l.status === "replied" || l.status === "booked").length || 0,
      booked: leads?.filter(l => l.status === "booked").length || 0,
      reviewSent: leads?.filter(l => l.review_sent).length || 0,
    };

    return res.status(200).json({
      success: true,
      leads: leads || [],
      messages: messages || [],
      submissions: submissions || [],
      stats,
    });
  } catch (err) {
    console.log("ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
