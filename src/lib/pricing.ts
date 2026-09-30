type OfferDiscount = {
  discount_type?: "percentage" | "flat" | "making_charge" | string | null;
  value?: number | string | null;
};

export type OfferPricing = {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  hasOffer: boolean;
  label: string;
};

function parseFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getOfferPricing(
  product: { price: number | string; offer_id?: string | null },
  discount: OfferDiscount | null | undefined,
): OfferPricing {
  const originalPrice = parseFiniteNumber(product.price) ?? 0;
  const value = parseFiniteNumber(discount?.value);

  if (!discount || value === null) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      hasOffer: false,
      label: "",
    };
  }

  if (discount.discount_type === "percentage") {
    const discountAmount = Math.round(originalPrice * (value / 100));
    return {
      originalPrice,
      finalPrice: Math.max(0, originalPrice - discountAmount),
      discountAmount,
      hasOffer: true,
      label: `${value}% OFF`,
    };
  }

  if (discount.discount_type === "flat") {
    const discountAmount = Math.min(originalPrice, value);
    return {
      originalPrice,
      finalPrice: Math.max(0, originalPrice - discountAmount),
      discountAmount,
      hasOffer: true,
      label: `₹${value} OFF`,
    };
  }

  return {
    originalPrice,
    finalPrice: originalPrice,
    discountAmount: 0,
    hasOffer: false,
    label: "",
  };
}
