export default function handler(req, res) {
  const digits = req.body?.Digits || "";
  res.setHeader("Content-Type", "text/xml");

  const voice = "Polly.Joanna-Neural";

  if (digits === "1") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    Got it. For rental information, we can help with unit sizes, availability, and getting started.
    Please hold while I connect you with someone who can help.
  </Say>
  <Redirect>/api/call-status?step=primary</Redirect>
</Response>`);
  }

  if (digits === "2") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    No problem. For payments, you can make a payment online or speak with someone for help.
    Please hold while I connect you.
  </Say>
  <Redirect>/api/call-status?step=primary</Redirect>
</Response>`);
  }

  if (digits === "3") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    Sure. For customer service, please hold while I connect you with a representative.
  </Say>
  <Redirect>/api/call-status?step=primary</Redirect>
</Response>`);
  }

  if (digits === "4") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    No problem. For move-out requests, someone can help you with the next steps.
    Please hold while I connect you.
  </Say>
  <Redirect>/api/call-status?step=primary</Redirect>
</Response>`);
  }

  if (digits === "5") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    Alright. I will connect you with a representative now.
  </Say>
  <Redirect>/api/call-status?step=primary</Redirect>
</Response>`);
  }

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    Sorry, I did not understand that selection.
  </Say>
  <Redirect>/api/voice</Redirect>
</Response>`);
}
