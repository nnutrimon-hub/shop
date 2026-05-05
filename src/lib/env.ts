function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ENV: ${name}`);
  return value;
}

export const env = {
  MONGODB_URI: required("MONGODB_URI"),
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME ?? "azimarket",
  NEXTAUTH_SECRET: required("NEXTAUTH_SECRET"),
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
  QPAY_USERNAME: process.env.QPAY_USERNAME,
  QPAY_PASSWORD: process.env.QPAY_PASSWORD,
  QPAY_INVOICE_CODE: process.env.QPAY_INVOICE_CODE,
  QPAY_BASE_URL: process.env.QPAY_BASE_URL ?? "https://merchant.qpay.mn/v2",
} as const;
