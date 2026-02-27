export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      error: "ID não informado na URL",
      exemplo: "/api/status?id=123456789"
    });
  }

  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({
        error: data.message || "Pagamento não encontrado",
        detalhes: data
      });
    }

    return res.status(200).json({
      id: data.id,
      status: data.status,
      valor: data.transaction_amount,
      metodo: data.payment_method_id
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erro interno ao consultar pagamento",
      detalhes: error.message
    });
  }
}
