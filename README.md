# AziMarket

Монгол хэлт онлайн дэлгүүрийн платформ. Next.js 15, MongoDB, NextAuth v5.

## Эхлүүлэх

```bash
pnpm install
pnpm dev
```

http://localhost:3000

---

## Тест данс

### Удирдлага (superadmin)

| Талбар  | Утга                        |
| ------- | --------------------------- |
| И-мэйл  | `admin@test.com`            |
| Нууц үг | `admin123`                  |
| Дүр     | superadmin                  |
| Хандах  | http://localhost:3000/admin |

### Хэрэглэгч

| Талбар  | Утга            |
| ------- | --------------- |
| И-мэйл  | `user@test.com` |
| Нууц үг | `user123`       |
| Дүр     | user            |

> Seed ажиллуулаагүй бол: `pnpm seed`

---

## Скриптүүд

```bash
pnpm dev          # dev server (http://localhost:3000)
pnpm build        # production build
pnpm start        # production server
pnpm seed         # MongoDB-д тест дата үүсгэх
pnpm tsc --noEmit # TypeScript шалгах
```

---

## Шаардлагатай ENV

`.env` файлд дараах утгуудыг тохируулна:

```env
# MongoDB
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=azimarket

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...


# Google OAuth
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...

# Facebook OAuth
AUTH_FACEBOOK_ID=...
AUTH_FACEBOOK_SECRET=...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (Telegram мэдэгдэл)
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Optional (QPay төлбөр)
QPAY_USERNAME=
QPAY_PASSWORD=
QPAY_INVOICE_CODE=
```

---

## Хуудсуудын жагсаалт

| URL                 | Тайлбар                    | Хандах эрх |
| ------------------- | -------------------------- | ---------- |
| `/`                 | Нүүр хуудас                | Бүгд       |
| `/products`         | Бүтээгдэхүүний жагсаалт    | Бүгд       |
| `/products/[slug]`  | Бүтээгдэхүүний дэлгэрэнгүй | Бүгд       |
| `/shopping-cart`    | Сагс + захиалах            | Бүгд       |
| `/auth/login`       | Нэвтрэх                    | —          |
| `/auth/register`    | Бүртгүүлэх                 | —          |
| `/accounts/orders`  | Миний захиалгууд           | Нэвтэрсэн  |
| `/accounts/profile` | Профайл                    | Нэвтэрсэн  |
| `/admin`            | Удирдлагын самбар          | admin+     |
| `/admin/products`   | Бараа удирдах              | admin+     |
| `/admin/orders`     | Захиалга удирдах           | moderator+ |
| `/admin/users`      | Хэрэглэгч удирдах          | admin+     |

---

## Технологийн стек

- **Next.js 15** — App Router, Server Components
- **MongoDB + Mongoose** — `sanitizeFilter: true` (NoSQL injection хамгаалалт)
- **NextAuth v5** — Google, Facebook, Credentials
- **Zustand** — Сагсны төлөв (localStorage persist)
- **TanStack Query v5** — Серверийн кэш
- **shadcn/ui** — `@base-ui/react` дээр суурилсан UI компонентууд
- **Tailwind CSS v4**
- **Cloudinary** — Зурагны хадгалалт (SDK-гүй, шууд REST API)
- **Zod + React Hook Form** — Форм баталгаажуулалт
- **isomorphic-dompurify** — XSS хамгаалалт

---

## RBAC дүрмийн матриц

| Үйлдэл                  | user | moderator | admin | superadmin |
| ----------------------- | ---- | --------- | ----- | ---------- |
| Бараа харах             | ✓    | ✓         | ✓     | ✓          |
| Бараа нэмэх/устгах      | —    | —         | ✓     | ✓          |
| Бараа засах             | —    | ✓         | ✓     | ✓          |
| Захиалга харах (бүгд)   | —    | ✓         | ✓     | ✓          |
| Захиалгын төлөв өөрчлөх | —    | —         | ✓     | ✓          |
| Хэрэглэгч удирдах       | —    | —         | ✓     | ✓          |
| Дүр өгөх                | —    | —         | —     | ✓          |
