export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  try {

    const idempotencyKey = Date.now().toString(); // ✅ não quebra build

    const mpResponse = await fetch(
      "https://api.mercadopago.com/v1/payments",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          "X-Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify({
          transaction_amount: 20,
          description: "Inscrição Campeonato Norbit White",
          payment_method_id: "pix",
          payer: {
            email: "teste@email.com"
          }
        })
      }
    );

    const data = await mpResponse.json();

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
