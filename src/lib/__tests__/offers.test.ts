import { describe, expect, it, vi, beforeEach } from "vitest";

const mockGetAnonClient = vi.fn();
const mockOfferSelect = vi.fn();

vi.mock("@/lib/supabase", () => ({
  getAnonClient: () => mockGetAnonClient(),
}));

import { getActiveOffers, getVisibleOfferBanners } from "../offers";

describe("offer helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active offers only when the dates are valid", async () => {
    mockOfferSelect.mockReturnValue({
      eq: vi.fn(async () => ({
        data: [
          {
            id: "offer-1",
            label: "Summer Sale",
            description: "Save on gold",
            is_active: true,
            start_date: "2024-01-01T00:00:00.000Z",
            end_date: null,
            charge_type: "percentage",
            discounts: [{ id: "d-1", discount_type: "percentage", value: 10 }],
          },
          {
            id: "offer-2",
            label: "Future Offer",
            description: "Not yet active",
            is_active: true,
            start_date: "2099-01-01T00:00:00.000Z",
            end_date: null,
            charge_type: "flat",
            discounts: [],
          },
          {
            id: "offer-3",
            label: "Inactive Offer",
            description: "Disabled",
            is_active: false,
            start_date: "2024-01-01T00:00:00.000Z",
            end_date: null,
            charge_type: "percentage",
            discounts: [],
          },
        ],
        error: null,
      })),
    });
    mockGetAnonClient.mockReturnValue({
      from: vi.fn(() => ({
        select: mockOfferSelect,
      })),
    });

    const offers = await getActiveOffers("2024-06-01T00:00:00.000Z");

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({ id: "offer-1", label: "Summer Sale" });
    expect(mockOfferSelect).toHaveBeenCalledWith(expect.stringContaining("is_active"));
  });

  it("includes active offers without a start date", async () => {
    mockGetAnonClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({
            data: [{
              id: "offer-no-start",
              label: "Always Available",
              is_active: true,
              start_date: null,
              end_date: null,
              discounts: [],
            }],
            error: null,
          })),
        })),
      })),
    });

    await expect(getActiveOffers("2024-06-01T00:00:00.000Z")).resolves.toMatchObject([
      { id: "offer-no-start", label: "Always Available" },
    ]);
  });

  it("filters malformed banners and respects display order", async () => {
    mockGetAnonClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            in: vi.fn(() => ({
              order: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [
                    { id: "b-1", offer_id: "offer-1", product_id: "p-1", image_url: "https://cdn.test/1.jpg", alt_text: "Banner 1", display_order: 2, updated_at: "2024-01-01T00:00:00.000Z" },
                    { id: "b-2", offer_id: "offer-1", product_id: "p-2", image_url: "", alt_text: "Missing image", display_order: 1, updated_at: "2024-01-02T00:00:00.000Z" },
                    { id: "b-3", offer_id: "offer-1", product_id: "p-3", image_url: "https://cdn.test/3.jpg", alt_text: "", display_order: 0, updated_at: "2024-01-03T00:00:00.000Z" },
                    { id: "b-4", offer_id: "offer-1", product_id: "p-4", image_url: "https://cdn.test/4.jpg", alt_text: "Banner 4", display_order: 1, updated_at: "2024-01-04T00:00:00.000Z" },
                  ],
                  error: null,
                })),
              })),
            })),
          })),
        })),
      })),
    });

    const banners = await getVisibleOfferBanners(["offer-1"]);

    expect(banners).toHaveLength(2);
    expect(banners[0]).toMatchObject({ id: "b-4", alt_text: "Banner 4" });
    expect(banners[1]).toMatchObject({ id: "b-1", alt_text: "Banner 1" });
  });

  it("returns empty arrays when Supabase errors", async () => {
    mockGetAnonClient.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(async () => ({ data: null, error: new Error("db offline") })),
        })),
      })),
    });

    await expect(getActiveOffers("2024-06-01T00:00:00.000Z")).resolves.toEqual([]);
    await expect(getVisibleOfferBanners(["offer-1"])).resolves.toEqual([]);
  });
});
