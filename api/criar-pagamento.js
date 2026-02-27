export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { nome, email, valor } = req.body;

    if (!nome || !email || !valor) {
      return res.status(400).json({
        error: 'Nome, email e valor são obrigatórios'
      });
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: "Inscrição Campeonato Norbit White",
        payment_method_id: "pix",
        payer: {
          email: email,
          first_name: nome
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      qr_code: data.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
