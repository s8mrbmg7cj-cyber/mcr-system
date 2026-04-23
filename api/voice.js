const twilio = require('twilio');

module.exports = async function handler(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    numDigits: 1,
    action: '/api/voice-menu',
    method: 'POST',
    timeout: 5,
  });

  gather.say(
    { voice: 'alice' },
    'Thank you for calling Prime Vault Self Storage. This is our automated assistant. ' +
      'I can help with rentals, payments, or general questions. ' +
      'You can say what you need, or use your keypad. ' +
      'Press 1 for rental information. ' +
      'Press 2 to make a payment. ' +
      'Press 3 for customer service. ' +
      'Press 4 for move out requests. ' +
      'Press 5 to speak with a representative.'
  );

  twiml.say(
    { voice: 'alice' },
    'Sorry, I did not get a response.'
  );
  twiml.redirect('/api/voice');

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
};
