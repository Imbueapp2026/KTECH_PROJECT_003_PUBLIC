import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewArrivalsStrip } from "../NewArrivalsStrip";
import type { ProductJoined } from "@/types";

function createProduct(id: string, createdDaysAgo: number, isNew: boolean): ProductJoined {
  const createdAt = new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    id,
    name: id,
    description: "",
    price: 100,
    category_id: "category-1",
    category: { id: "category-1", name: "Rings", slug: "rings" },
    availability: "available",
    status: "published",
    offer_id: null,
    created_at: createdAt,
    updated_at: createdAt,
    image_urls: [],
    hallmark_certified: true,
    is_new: isNew,
  };
}

describe("NewArrivalsStrip", () => {
  it("moves older new arrivals into Recently Added and drops its oldest products", () => {
    const newArrivals = Array.from({ length: 9 }, (_, index) =>
      createProduct(`new-${index}`, index, true),
    );
    const recentlyAdded = Array.from({ length: 9 }, (_, index) =>
      createProduct(`recent-${index}`, 40 + index, false),
    );

    render(<NewArrivalsStrip products={[...newArrivals, ...recentlyAdded]} />);

    for (let index = 0; index < 8; index += 1) {
      expect(screen.getByText(`new-${index}`)).toBeInTheDocument();
    }
    expect(screen.getByText("new-8")).toBeInTheDocument();
    expect(screen.getByText("recent-0")).toBeInTheDocument();
    expect(screen.getByText("recent-6")).toBeInTheDocument();
    expect(screen.queryByText("recent-7")).not.toBeInTheDocument();
    expect(screen.queryByText("recent-8")).not.toBeInTheDocument();
  });
});