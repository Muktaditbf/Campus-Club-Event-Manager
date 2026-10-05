import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// MySQL values arrive as strings ("2026-02-10" or "2026-02-10 10:00:00") because
// the pool uses dateStrings, so format them by hand to avoid timezone shifts.
function parts(value: string) {
  const [date, time = "00:00:00"] = value.split(" ");
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return { y, m, d, hh, mm };
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const { y, m, d } = parts(value);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function formatTime(value: string | null | undefined) {
  if (!value) return "";
  const { hh, mm } = parts(value);
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return `${formatDate(value)}, ${formatTime(value)}`;
}

export function monthLabel(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return `${MONTHS[m - 1]} ${String(y).slice(2)}`;
}

/** "2026-02-10 10:00:00" -> "2026-02-10T10:00" for <input type="datetime-local"> */
export function toDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 16).replace(" ", "T");
}

export function formatTaka(value: number | null | undefined, digits = 0) {
  const n = Number(value ?? 0);
  return `৳${n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: 2 })}`;
}

export function formatNumber(value: number | null | undefined) {
  return Number(value ?? 0).toLocaleString("en-IN");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
