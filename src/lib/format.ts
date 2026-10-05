import { format, parseISO, isValid } from "date-fns";
import { ja } from "date-fns/locale";

export function formatDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = parseISO(value);
    if (isValid(parsed)) return format(parsed, "yyyy年M月d日", { locale: ja });
  }
  return value;
}

export function formatTokyoDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(parsed);
  const num = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const y = num("year");
  const m = String(num("month")).padStart(2, "0");
  const d = String(num("day")).padStart(2, "0");
  return formatDate(`${y}-${m}-${d}`);
}

export function withinMonths(iso: string, months: number, asOf = new Date()): boolean {
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return false;
  const until = new Date(start);
  until.setMonth(until.getMonth() + months);
  return asOf.getTime() < until.getTime();
}

export function isYoutubeClip(url: string, sourceLabel = ""): boolean {
  if (/youtube|ユーチューブ/i.test(sourceLabel)) return true;
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return host === "youtu.be" || host === "youtube.com" || host.endsWith(".youtube.com");
  } catch {
    return /youtu\.be|youtube\.com/i.test(url);
  }
}

export function formatDateTime(value: number): string {
  return new Date(value).toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function tokyoToday(asOf = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(asOf);
  const num = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return new Date(num("year"), num("month") - 1, num("day"));
}

export function ageFromBirthday(birthday?: string, asOf = tokyoToday()): number | undefined {
  if (!birthday || !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return undefined;
  const birth = parseISO(birthday);
  if (!isValid(birth)) return undefined;
  let age = asOf.getFullYear() - birth.getFullYear();
  const md = asOf.getMonth() * 32 + asOf.getDate();
  const bmd = birth.getMonth() * 32 + birth.getDate();
  if (md < bmd) age -= 1;
  return age >= 0 ? age : undefined;
}

export function yearsOnRoster(
  joined?: string,
  left?: string,
  asOf = tokyoToday(),
): number | undefined {
  const start = Number(joined);
  if (!Number.isInteger(start) || start < 1900) return undefined;
  const end = left ? Number(left) : asOf.getFullYear();
  if (!Number.isInteger(end) || end < start) return undefined;
  return end - start + 1;
}
