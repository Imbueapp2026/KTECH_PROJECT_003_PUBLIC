export const NEW_ARRIVAL_DAYS = 5;

export function isNewArrival(createdAt: string | null | undefined, now = Date.now()): boolean {
  if (!createdAt) return false;

  const createdAtMs = new Date(createdAt).getTime();
  const ageMs = now - createdAtMs;
  return Number.isFinite(createdAtMs) && ageMs >= 0 && ageMs <= NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatStoredRupees(value: number | string): string {
  const rawValue = String(value);
  const match = rawValue.match(/^(-?)(\d+)(\.\d+)?$/);
  if (!match) return `₹${rawValue}`;

  const [, sign, integerPart, fractionalPart = ""] = match;
  const groupedInteger = integerPart.replace(/\B(?=(\d{2})*\d{3}(?!\d))/g, ",");
  return `₹${sign}${groupedInteger}${fractionalPart}`;
}

export function getOfferDiscountTypeLabel(type?: import("@/types").OfferDiscountType | null): string {
  switch (type) {
    case "flat": return "Flat offer";
    case "percentage": return "Percentage offer";
    case "making_charge": return "Making charge offer";
    case "mixed": return "Mixed offer";
    default: return "";
  }
}

export function formatWeight(n: number): string {
  return `${n.toFixed(3)}g`;
}

export function formatGoldPrice(n: number): string {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/gram`;
}
