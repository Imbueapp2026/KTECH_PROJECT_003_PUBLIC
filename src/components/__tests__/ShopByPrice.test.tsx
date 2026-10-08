import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShopByPrice } from "../ShopByPrice";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ fill: _fill, priority: _priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => (
    <img {...props} />
  ),
}));

describe("ShopByPrice", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a 60,000+ card to the shop-by-price section without changing the filter bar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          {
            minPrice: 0,
            maxPrice: 50000,
            label: "Under ₹50,000",
            product: {
              id: "p-1",
              name: "Aster Ring",
              image_urls: ["https://example.com/ring.jpg"],
            },
          },
          {
            minPrice: 50000,
            maxPrice: 60000,
            label: "₹50,000–₹60,000",
            product: {
              id: "p-2",
              name: "Pearl Necklace",
              image_urls: ["https://example.com/necklace.jpg"],
            },
          },
        ],
      }),
    }));

    render(<ShopByPrice />);

    expect(await screen.findByText("₹60,000+")).toBeInTheDocument();
    expect(screen.queryByText("₹50,000 - ₹1,00,000")).not.toBeInTheDocument();
  });
});
