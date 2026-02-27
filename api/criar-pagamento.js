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

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Use POST." });
  }

  try {
    const token = process.env.MP_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "MP_ACCESS_TOKEN não configurado na Vercel." });
    }

    const { valor, descricao, email, whatsapp, nome } = req.body || {};

    // ===== validações =====
    const amount = Number(valor);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Campo 'valor' inválido. Envie número ex: 15.5" });
    }

    const payerEmail = (email || "").trim() || "comprador@email.com";
    if (!payerEmail.includes("@") || payerEmail.length < 6) {
      return res.status(400).json({ error: "Campo 'email' inválido." });
    }

    const desc = (descricao || "Pagamento PIX").toString().slice(0, 200);

    // ===== Mercado Pago PIX =====
    const paymentData = {
      transaction_amount: amount,
      description: desc,
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
        first_name: (nome || "").toString().slice(0, 60) || "Comprador",
      },
      metadata: {
        whatsapp: (whatsapp || "").toString().slice(0, 30),
      },
    };

    const mpRes = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `pix-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      },
      body: JSON.stringify(paymentData),
    });

    const mpJson = await mpRes.json().catch(() => ({}));

    if (!mpRes.ok) {
      // devolve o erro real do MP (ajuda MUITO)
      return res.status(mpRes.status).json({
        error: "Erro ao criar pagamento no Mercado Pago",
        mp_status: mpRes.status,
        mp_response: mpJson,
      });
    }

    const paymentId = mpJson?.id;
    const tx = mpJson?.point_of_interaction?.transaction_data;

    const qrBase64 = tx?.qr_code_base64;
    const qrCode = tx?.qr_code; // copia e cola (código pix)

    if (!paymentId || !qrBase64) {
      return res.status(500).json({
        error: "Pagamento criado, mas resposta veio sem QR Code.",
        mp_response: mpJson,
      });
    }

    return res.status(200).json({
      payment_id: String(paymentId),
      qr_code_base64: qrBase64,
      qr_code: qrCode || "",
      status: mpJson?.status || "pending",
    });
  } catch (err) {
    return res.status(500).json({ error: "Falha interna", message: err?.message || String(err) });
  }
}
