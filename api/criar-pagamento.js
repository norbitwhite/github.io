export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {

    const idempotencyKey = Date.now().toString();

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        "X-Idempotency-Key": idempotencyKey
      },
      body: JSON.stringify({
        transaction_amount: 20,
        description: "Inscrição Campeonato Norbit White",
        payment_method_id: "pix",
        payer: {
          email: "comprador@email.com"
        }
      })
    });

    const data = await response.json();

    if (!data.point_of_interaction) {
      return res.status(500).json(data);
    }

    return res.status(200).json({
      id: data.id,
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64:
        data.point_of_interaction.transaction_data.qr_code_base64
    });

  } catch (error) {
    return res.status(500).json({ error: "Erro interno" });
  }
}
