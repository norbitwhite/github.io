export default async function handler(req, res) {
  // ===== CORS =====
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método não permitido. Use GET." });
  }

  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado na Vercel." });
    }

    const paymentId = (req.query.payment_id || "").toString().trim();
    if (!paymentId) {
      return res.status(400).json({ error: "payment_id obrigatório" });
    }

    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const mpJson = await mpRes.json().catch(() => ({}));

    if (!mpRes.ok) {
      return res.status(mpRes.status).json({
        error: "Erro ao consultar status no Mercado Pago",
        mp_status: mpRes.status,
        mp_response: mpJson,
      });
    }

    return res.status(200).json({
      payment_id: String(mpJson?.id || paymentId),
      status: mpJson?.status || "unknown",
      status_detail: mpJson?.status_detail || "",
    });
  } catch (err) {
    return res.status(500).json({ error: "Falha interna", message: err?.message || String(err) });
  }
}
