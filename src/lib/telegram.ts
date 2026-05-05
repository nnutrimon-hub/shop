export interface OrderNotificationParams {
  orderId: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  district: string;
  address: string;
  items: { name: string; quantity: number }[];
}

export async function sendOrderNotification(
  params: OrderNotificationParams
): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) return;

  const itemList = params.items
    .map((i) => `${i.name} x${i.quantity}`)
    .join(", ");

  const text = [
    `📦 Шинэ захиалга: #${params.orderId}`,
    `👤 Хэрэглэгч: ${params.customerName} / ${params.phone}`,
    `💰 Нийт дүн: ${new Intl.NumberFormat("mn-MN").format(params.totalAmount)}₮`,
    `📍 Байршил: ${params.district}, ${params.address}`,
    `📝 Бараанууд: ${itemList}`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}
