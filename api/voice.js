export default function handler(req, res) {
  res.setHeader("Content-Type", "text/xml");

  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather numDigits="1" action="/api/voice-menu" method="POST" timeout="7">
    <Say voice="alice">
      Thank you for calling Prime Vault Self Storage. This is our automated assistant.
      I can help with rentals, payments, or general questions.
      You can say what you need, or use your keypad.
      Press 1 for rental information.
      Press 2 to make a payment.
      Press 3 for customer service.
      Press 4 for move out requests.
      Press 5 to speak with a representative.
    </Say>
  </Gather>

  <Say voice="alice">
    Sorry, I did not get a response. Let me repeat that.
  </Say>

  <Redirect>/api/voice</Redirect>
</Response>`);
}
