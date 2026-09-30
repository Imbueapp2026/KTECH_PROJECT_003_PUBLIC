type OfferDiscount = {
  discount_type?: "percentage" | "flat" | "making_charge" | string | null;
  value?: number | null;
};

export type OfferPricing = {
  originalPrice: number;
  finalPrice: number;
  discountAmount: number;
  hasOffer: boolean;
  label: string;
};

export function getOfferPricing(
  product: { price: number; offer_id?: string | null },
  discount: OfferDiscount | null | undefined,
): OfferPricing {
  const originalPrice = Number.isFinite(product.price) ? product.price : 0;

  if (!discount || typeof discount.value !== "number" || !Number.isFinite(discount.value)) {
    return {
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      hasOffer: false,
      label: "",
    };
  }

  const value = Number(discount.value);
  if (!Number.isFinite(value)) {
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
