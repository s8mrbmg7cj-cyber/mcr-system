export default function handler(req, res) {
  const voice = "Polly.Joanna-Neural";
  const step = req.query.step || "primary";
  const status = req.body?.DialCallStatus || "";

  const WILLY = "+14056844399";
  const LISA = "+13098372171";

  res.setHeader("Content-Type", "text/xml");

  if (status === "completed") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response></Response>`);
  }

  if (step === "primary") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">Please hold while I try the first representative.</Say>
  <Dial timeout="20" action="/api/call-status?step=secondary" method="POST">
    <Number>${WILLY}</Number>
  </Dial>
</Response>`);
  }

  if (step === "secondary") {
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    I could not reach the first representative. Please hold while I try another team member.
  </Say>
  <Dial timeout="20" action="/api/call-status?step=voicemail" method="POST">
    <Number>${LISA}</Number>
  </Dial>
</Response>`);
  }

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">
    Looks like no one is available right now. I can take a message and have someone follow up.
  </Say>
  <Redirect>/api/voicemail</Redirect>
</Response>`);
}
