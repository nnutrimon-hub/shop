import { Mail, MapPin, Phone, ShoppingBag } from "lucide-react";
import Link from "next/link";

const HELP_LINKS = [
  { label: "Бидний тухай", href: "/" },
  { label: "Холбоо барих", href: "/" },
  { label: "Түгээмэл асуултууд", href: "/" },
  { label: "Нийтлэл", href: "/" },
];

const SOCIAL = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon
          points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"
          fill="white"
        />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t bg-muted/20">
      <div className="md:px-24 px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5 w-fit">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl tracking-tight">
                AziMarket
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              🇲🇳 🛒 Монголын тэргүүлэх онлайн дэлгүүр. Чанартай бараа
              бүтээгдэхүүн хямд үнээр. Найдвартай үйлчилгээ.
            </p>
            {/* Social icons */}
            <div className="flex items-center gap-2 pt-1">
              {SOCIAL.map(({ svg, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Help links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Туслах цэс</h3>
            <ul className="space-y-3">
              {HELP_LINKS.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Холбоо барих</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span className="leading-relaxed">
                  Улаанбаатар хот, Баруун 4 зам, Голомт хотхоны зүүн талд
                </span>
              </div>
              <a
                href="tel:+97677440880"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Phone className="w-4 h-4 shrink-0 text-primary" />
                77440880
              </a>
              <a
                href="mailto:info@azimarket.mn"
                className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="w-4 h-4 shrink-0 text-primary" />
                info@azimarket.mn
              </a>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Байршил</h3>
            <div className="w-full h-36 rounded-xl overflow-hidden border bg-muted flex items-center justify-center">
              <a
                href="https://www.google.com/maps/place/Emart+-+Chinggis/@47.9194686,106.9329842,14.9z/data=!4m6!3m5!1s0x5d969215f3f9493f:0x5bb3cc4e7abf2678!8m2!3d47.9234233!4d106.9341687!16s%2Fg%2F11c1lk9l41?entry=ttu&g_ep=EgoyMDI2MDUxMi4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <MapPin className="w-7 h-7" />
                <span className="text-xs font-medium">Google Maps-д харах</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t">
        <div className="md:px-24 px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} AziMarket. Бүх эрх хуулиар
            хамгаалагдсан.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Үйлчилгээний нөхцөл
            </Link>
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Нууцлалын бодлого
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
