interface QPaToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface QPaInvoiceRes {
  invoice_id: string;
  qPay_shortUrl: string;
  qr_image: string;
  urls: { name: string; description: string; link: string }[];
}

interface QPaPaymentCheckRes {
  count: number;
  paid_amount: number;
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const username = process.env.QPAY_USERNAME;
  const password = process.env.QPAY_PASSWORD;
  const baseUrl = process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn/v2";

  if (!username || !password) throw new Error("Missing ENV: QPAY_USERNAME or QPAY_PASSWORD");

  const creds = Buffer.from(`${username}:${password}`).toString("base64");
  const res = await fetch(`${baseUrl}/auth/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!res.ok) throw new Error("QPay токен авахад алдаа гарлаа");

  const data: QPaToken = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function createQPayInvoice(params: {
  orderId: string;
  amount: number;
  callbackUrl: string;
}): Promise<QPaInvoiceRes> {
  const token = await getToken();
  const baseUrl = process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn/v2";
  const invoiceCode = process.env.QPAY_INVOICE_CODE;

  if (!invoiceCode) throw new Error("Missing ENV: QPAY_INVOICE_CODE");

  const res = await fetch(`${baseUrl}/invoice`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice_code: invoiceCode,
      sender_invoice_no: params.orderId,
      invoice_receiver_code: "terminal",
      invoice_description: `AziMarket захиалга ${params.orderId}`,
      amount: params.amount,
      callback_url: params.callbackUrl,
    }),
  });

  if (!res.ok) throw new Error("QPay нэхэмжлэл үүсгэхэд алдаа гарлаа");
  return res.json();
}

export async function checkQPayPayment(
  invoiceId: string
): Promise<QPaPaymentCheckRes> {
  const token = await getToken();
  const baseUrl = process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn/v2";

  const res = await fetch(`${baseUrl}/payment/check`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ object_type: "INVOICE", object_id: invoiceId }),
  });

  if (!res.ok) throw new Error("QPay төлбөр шалгахад алдаа гарлаа");
  return res.json();
}
