export default function handler(req, res) {
  const voice = "Polly.Joanna-Neural";

  res.setHeader("Content-Type", "text/xml");

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    Please leave your name, phone number, and how we can help.
    We will get back to you as soon as possible.
  </Say>

  <Record
    maxLength="120"
    playBeep="true"
    transcribe="true"
    recordingStatusCallback="/api/voicemail-status"
    recordingStatusCallbackMethod="POST"
  />

  <Say voice="${voice}">We did not receive a message. Goodbye.</Say>
  <Hangup/>
</Response>`);
}
