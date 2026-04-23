const twilio = require('twilio');

const WILLY = '+14056844399';
const LISA = '+13098372171';

module.exports = async function handler(req, res) {
  const twiml = new twilio.twiml.VoiceResponse();
  const step = req.query.step || 'primary';

  if (step === 'primary') {
    twiml.say(
      { voice: 'alice' },
      'Please hold while I connect you to a representative.'
    );

    const dial = twiml.dial({
      timeout: 20,
      action: '/api/call-status?step=secondary',
      method: 'POST',
    });

    dial.number(WILLY);
  } else if (step === 'secondary') {
    const dialCallStatus =
      (req.body && req.body.DialCallStatus) ||
      (typeof req.body === 'string'
        ? new URLSearchParams(req.body).get('DialCallStatus')
        : '');

    if (dialCallStatus === 'completed') {
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    twiml.say(
      { voice: 'alice' },
      'We could not reach the first representative. Please hold while I try another team member.'
    );

    const dial = twiml.dial({
      timeout: 20,
      action: '/api/call-status?step=voicemail-check',
      method: 'POST',
    });

    dial.number(LISA);
  } else {
    const dialCallStatus =
      (req.body && req.body.DialCallStatus) ||
      (typeof req.body === 'string'
        ? new URLSearchParams(req.body).get('DialCallStatus')
        : '');

    if (dialCallStatus === 'completed') {
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(twiml.toString());
    }

    twiml.say(
      { voice: 'alice' },
      'Looks like no one is available right now.'
    );
    twiml.redirect('/api/voicemail');
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
};
