function setCors(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://norbitwhite.github.io");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  setCors(req, res);

  // Preflight (CORS)
  if (req.method === "OPTIONS") return res.status(204).end();

  // Essa rota é GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({
        error: "MP_ACCESS_TOKEN não configurado no Vercel (Environment Variables)."
      });
    }

    const payment_id = req.query?.payment_id;

    if (!payment_id) {
      return res.status(400).json({ error: "payment_id é obrigatório" });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    const mpData = await mpRes.json();

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({
        error: "Erro ao consultar pagamento no Mercado Pago",
        details: mpData
      });
    }

    return res.status(200).json({
      id: mpData.id,
      status: mpData.status,
      status_detail: mpData.status_detail,
      transaction_amount: mpData.transaction_amount
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Erro interno" });
  }
}
