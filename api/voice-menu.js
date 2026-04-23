const twilio = require('twilio');

function getDigits(req) {
  if (req.body && typeof req.body === 'object') return req.body.Digits;
  if (typeof req.body === 'string') {
    return new URLSearchParams(req.body).get('Digits');
  }
  return undefined;
}

module.exports = async function handler(req, res) {
  const digit = getDigits(req);
  const twiml = new twilio.twiml.VoiceResponse();

  switch (digit) {
    case '1': {
      twiml.say(
        { voice: 'alice' },
        'Got it. Looking for a storage unit. We offer different unit sizes depending on what you need.'
      );

      const gather = twiml.gather({
        numDigits: 1,
        action: '/api/voice-menu?followup=rentals',
        method: 'POST',
        timeout: 5,
      });

      gather.say(
        { voice: 'alice' },
        'Press 1 if you want to speak with a representative now. Or stay on the line and leave a message.'
      );

      twiml.redirect('/api/voicemail');
      break;
    }

    case '2': {
      twiml.say(
        { voice: 'alice' },
        'No problem. You can make a payment online in just a minute.'
      );

      const gather = twiml.gather({
        numDigits: 1,
        action: '/api/voice-menu?followup=payments',
        method: 'POST',
        timeout: 5,
      });

      gather.say(
        { voice: 'alice' },
        'Press 1 to speak with a representative for payment help. Or stay on the line and leave a message.'
      );

      twiml.redirect('/api/voicemail');
      break;
    }

    case '3': {
      twiml.say(
        { voice: 'alice' },
        'Sure. I can help with account questions, billing, or general support.'
      );
      twiml.redirect('/api/call-status?step=primary');
      break;
    }

    case '4': {
      twiml.say(
        { voice: 'alice' },
        'No problem. I can help with your move out request.'
      );

      const gather = twiml.gather({
        numDigits: 1,
        action: '/api/voice-menu?followup=moveout',
        method: 'POST',
        timeout: 5,
      });

      gather.say(
        { voice: 'alice' },
        'Press 1 to speak with a representative now. Or stay on the line and leave a message with your move out date.'
      );

      twiml.redirect('/api/voicemail');
      break;
    }

    case '5': {
      twiml.say(
        { voice: 'alice' },
        'Alright. I will connect you to someone now.'
      );
      twiml.redirect('/api/call-status?step=primary');
      break;
    }

    default: {
      const followup = req.query.followup;

      if (followup && digit === '1') {
        twiml.say({ voice: 'alice' }, 'Alright. I will connect you now.');
        twiml.redirect('/api/call-status?step=primary');
      } else {
        twiml.say({ voice: 'alice' }, 'Sorry, that was not a valid option.');
        twiml.redirect('/api/voice');
      }
    }
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
};
