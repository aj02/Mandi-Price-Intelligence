import { QUINTAL_TO_KG } from "./constants";

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const numFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const num1Formatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1,
});

export function inr(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return inrFormatter.format(n);
}

export function num(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return numFormatter.format(n);
}

export function pct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${num1Formatter.format(n)}%`;
}

export function perKg(quintalPrice: number | null | undefined): number | null {
  if (quintalPrice == null || !Number.isFinite(quintalPrice)) return null;
  return quintalPrice / QUINTAL_TO_KG;
}

export function priceWithUnit(
  quintalPrice: number | null | undefined,
  unit: "quintal" | "kg" = "quintal",
): string {
  if (unit === "kg") {
    const kg = perKg(quintalPrice);
    if (kg == null) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 1,
    }).format(kg);
  }
  return inr(quintalPrice);
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function fmtDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  return dateFormatter.format(d);
}

const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
  hour12: false,
});

export function fmtTimeIST(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  return `${timeFormatter.format(d)} IST`;
}
