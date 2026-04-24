export default function handler(req, res) {
  const digits = req.body?.Digits || "";
  const voice = "Polly.Joanna-Neural";

  res.setHeader("Content-Type", "text/xml");

  const transfer = (message) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">${message}</Say>
  <Redirect>/api/call-status?step=primary</Redirect>
</Response>`;

  if (digits === "1") {
    return res.status(200).send(transfer(
      "Got it. You are looking for rental information. We can help with unit sizes, availability, and getting started. Please hold while I connect you with someone who can help."
    ));
  }

  if (digits === "2") {
    return res.status(200).send(transfer(
      "No problem. For payments, I will connect you with someone who can assist."
    ));
  }

  if (digits === "3") {
    return res.status(200).send(transfer(
      "Sure. For customer service, please hold while I connect you with a representative."
    ));
  }

  if (digits === "4") {
    return res.status(200).send(transfer(
      "No problem. For move-out requests, someone can help you with the next steps. Please hold while I connect you."
    ));
  }

  if (digits === "5") {
    return res.status(200).send(transfer(
      "Alright. I will connect you with a representative now."
    ));
  }

  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}">Sorry, I did not understand that selection.</Say>
  <Redirect>/api/voice</Redirect>
</Response>`);
}
