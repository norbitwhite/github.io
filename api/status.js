export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { payment_id } = req.query;

    if (!payment_id) {
      return res.status(400).json({
        error: 'payment_id é obrigatório'
      });
    }

    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${payment_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      transaction_amount: data.transaction_amount
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
