export interface OrderNotificationParams {
  orderId: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  district: string;
  address: string;
  items: { name: string; quantity: number }[];
  paymentMethod?: "qpay" | "cod";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  return phone;
}

export async function sendOrderNotification(
  params: OrderNotificationParams
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const paymentLabel =
    params.paymentMethod === "qpay"
      ? "QPay"
      : params.paymentMethod === "cod"
        ? "Бараа хүлээж аваад төлөх"
        : null;

  const totalFormatted = `${new Intl.NumberFormat("mn-MN").format(
    params.totalAmount
  )}₮`;

  const itemLines = params.items
    .map(
      (i) =>
        `   • ${escapeHtml(i.name)} — <b>${i.quantity}</b> ширхэг`
    )
    .join("\n");

  const lines: string[] = [
    "🔔 <b>ШИНЭ ЗАХИАЛГА ИРЛЭЭ</b>",
    "",
    `🆔 <b>Захиалгын дугаар:</b> #${escapeHtml(params.orderId)}`,
    "",
    "👤 <b>ЗАХИАЛАГЧИЙН МЭДЭЭЛЭЛ</b>",
    `   • Нэр: ${escapeHtml(params.customerName)}`,
    `   • Утас: <a href="tel:${escapeHtml(params.phone)}">${escapeHtml(
      formatPhone(params.phone)
    )}</a>`,
    "",
    "📍 <b>ХҮРГЭЛТИЙН ХАЯГ</b>",
    `   • Дүүрэг: ${escapeHtml(params.district)}`,
    `   • Хаяг: ${escapeHtml(params.address)}`,
    "",
    "📦 <b>ЗАХИАЛСАН БАРАА</b>",
    itemLines,
    "",
  ];

  if (paymentLabel) {
    lines.push(`💳 <b>Төлбөрийн арга:</b> ${paymentLabel}`);
  }
  lines.push(`💰 <b>Нийт дүн:</b> ${totalFormatted}`);

  const text = lines.join("\n");

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
}
