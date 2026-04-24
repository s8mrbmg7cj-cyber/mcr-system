export default async function handler(req, res) {
  console.log("Voicemail received:", {
    from: req.body?.From,
    callSid: req.body?.CallSid,
    recordingUrl: req.body?.RecordingUrl,
    transcriptionText: req.body?.TranscriptionText,
  });

  res.status(200).json({ ok: true });
}
