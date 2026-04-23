module.exports = async function handler(req, res) {
  try {
    const data =
      typeof req.body === 'string'
        ? Object.fromEntries(new URLSearchParams(req.body))
        : req.body || {};

    console.log('Voicemail received:', {
      from: data.From,
      callSid: data.CallSid,
      recordingUrl: data.RecordingUrl,
      recordingSid: data.RecordingSid,
      transcriptionText: data.TranscriptionText,
    });

    // Later: send email to info@primevaultselfstorage.com here

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('voicemail-status error:', error);
    res.status(500).json({ ok: false, error: 'Failed to process voicemail' });
  }
};
