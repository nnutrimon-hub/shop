import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME ?? "azimarket";

if (!MONGODB_URI) {
  throw new Error("Missing ENV: MONGODB_URI");
}

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME,
    sanitizeFilter: true,
  });

  console.log("✅ MongoDB холбогдлоо:", MONGODB_DB_NAME);

  const { default: User } = await import("../src/models/User");
  const { default: DeliveryZone } = await import("../src/models/DeliveryZone");
  const { default: Category } = await import("../src/models/Category");

  // ── Seed users ─────────────────────────────────────────────────────────────
  const adminExists = await User.findOne({ email: "admin@test.com" });
  if (!adminExists) {
    await User.create({
      name: "Super Admin",
      email: "admin@test.com",
      password: await bcrypt.hash("admin123", 12),
      role: "superadmin",
      provider: "credentials",
    });
    console.log("✅ admin@test.com (superadmin) үүслээ");
  } else {
    console.log("ℹ️  admin@test.com аль хэдийн байна");
  }

  const userExists = await User.findOne({ email: "user@test.com" });
  if (!userExists) {
    await User.create({
      name: "Туршилтын Хэрэглэгч",
      email: "user@test.com",
      password: await bcrypt.hash("user123", 12),
      role: "user",
      provider: "credentials",
    });
    console.log("✅ user@test.com (user) үүслээ");
  } else {
    console.log("ℹ️  user@test.com аль хэдийн байна");
  }

  // ── Seed delivery zones ────────────────────────────────────────────────────
  const zones = [
    { district: "Баянзүрх", fee: 3000 },
    { district: "Сүхбаатар", fee: 3000 },
    { district: "Чингэлтэй", fee: 2500 },
    { district: "Хан-Уул", fee: 3500 },
    { district: "Баянгол", fee: 2500 },
    { district: "Сонгинохайрхан", fee: 4000 },
    { district: "Налайх", fee: 5000 },
    { district: "Багануур", fee: 6000 },
    { district: "Багахангай", fee: 5500 },
  ];

  for (const z of zones) {
    await DeliveryZone.findOneAndUpdate(
      { district: z.district },
      z,
      { upsert: true, new: true }
    );
  }
  console.log("✅ Хүргэлтийн бүсүүд бэлэн болсон");

  // ── Seed categories ────────────────────────────────────────────────────────
  const categories = [
    { name: "Гоо сайхан", slug: "goo-saikhan", description: "Гоо сайханы бүтээгдэхүүн", imageKey: "" },
    { name: "Хувцас", slug: "huvtsas", description: "Эмэгтэй, эрэгтэй хувцас", imageKey: "" },
    { name: "Гэр ахуй", slug: "ger-akhui", description: "Гэрийн хэрэгслүүд", imageKey: "" },
    { name: "Электроник", slug: "elektronik", description: "Электрон бараанууд", imageKey: "" },
  ];

  for (const cat of categories) {
    await Category.findOneAndUpdate(
      { slug: cat.slug },
      cat,
      { upsert: true, new: true }
    );
  }
  console.log("✅ Ангилалууд бэлэн болсон");

  await mongoose.disconnect();
  console.log("\n🎉 Seed амжилттай дууслаа!");
}

seed().catch((e) => {
  console.error("❌ Seed алдаа:", e);
  process.exit(1);
});
