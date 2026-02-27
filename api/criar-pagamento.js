export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        transaction_amount: 20, // ALTERE SE QUISER
        description: "Inscrição Campeonato Warzone",
        payment_method_id: "pix",
        payer: {
          email: "comprador@email.com",
        },
      }),
    });

    const data = await mpResponse.json();

    if (!data.point_of_interaction) {
      return res.status(500).json({ error: data });
    }

    return res.status(200).json({
      id: data.id,
      qr_code_base64:
        data.point_of_interaction.transaction_data.qr_code_base64,
    });

  } catch (error) {
    return res.status(500).json({ error: "Erro ao criar pagamento" });
  }
}
