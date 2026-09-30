import { describe, expect, it } from "vitest";
import { getOfferPricing } from "../pricing";

describe("getOfferPricing", () => {
  it("applies percentage discounts to numeric strings from the database", () => {
    expect(getOfferPricing(
      { price: "7015", offer_id: "offer-1" },
      { discount_type: "percentage", value: "10" },
    )).toMatchObject({
      originalPrice: 7015,
      finalPrice: 6313,
      discountAmount: 702,
      hasOffer: true,
      label: "10% OFF",
    });
  });
});