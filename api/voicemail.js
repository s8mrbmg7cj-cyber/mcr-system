const twilio = require('twilio');

module.exports = async function handler(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say(
    { voice: 'alice' },
    'Please leave your name, number, and how we can help, and we will get back to you as soon as possible.'
  );

  twiml.record({
    maxLength: 120,
    playBeep: true,
    transcribe: true,
    recordingStatusCallback: '/api/voicemail-status',
    recordingStatusCallbackMethod: 'POST',
  });

  twiml.say({ voice: 'alice' }, 'We did not receive a message. Goodbye.');
  twiml.hangup();

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
};
