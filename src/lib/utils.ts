import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import "dayjs/locale/mn";

dayjs.locale("mn");

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat("mn-MN").format(Math.round(amount))}₮`;
}

export function formatDate(date: string | Date, format = "YYYY.MM.DD"): string {
  return dayjs(date).format(format);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
}
