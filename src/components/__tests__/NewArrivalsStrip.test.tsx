import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewArrivalsStrip } from "../NewArrivalsStrip";
import type { ProductJoined } from "@/types";

function createProduct(
  id: string,
  createdDaysAgo: number,
  categorySlug = "rings",
  categoryName = "Rings",
): ProductJoined {
  const createdAt = new Date(Date.now() - createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();

  return {
    id,
    name: id,
    description: "",
    price: 100,
    category_id: `category-${categorySlug}`,
    category: { id: `category-${categorySlug}`, name: categoryName, slug: categorySlug },
    availability: "available",
    status: "published",
    offer_id: null,
    created_at: createdAt,
    updated_at: createdAt,
    image_urls: [],
    hallmark_certified: true,
  };
}

describe("NewArrivalsStrip", () => {
  it("shows only products within the five-day window, newest first", () => {
    const newArrivals = Array.from({ length: 9 }, (_, index) =>
      createProduct(`new-${index}`, index * 0.5),
    );
    const recentlyAdded = Array.from({ length: 9 }, (_, index) =>
      createProduct(`recent-${index}`, 10 + index),
    );

    render(<NewArrivalsStrip products={[...newArrivals, ...recentlyAdded]} />);

    for (let index = 0; index < 8; index += 1) {
      expect(screen.getByText(`new-${index}`)).toBeInTheDocument();
    }
    expect(screen.getByText("new-8")).toBeInTheDocument();
    expect(screen.queryByText("recent-0")).not.toBeInTheDocument();
    expect(screen.queryByText("recent-8")).not.toBeInTheDocument();
  });

  it("balances categories in both arrival groups without duplicating products", () => {
    const newestProducts = Array.from({ length: 8 }, (_, index) =>
      createProduct(`latest-${index}`, index * 0.1),
    );
    const variedRecentProducts = Array.from({ length: 16 }, (_, index) => {
      const categoryIndex = Math.floor(index / 2);
      return createProduct(
        `varied-${index}`,
        2 + index * 0.1,
        `category-${categoryIndex}`,
        `Category ${categoryIndex}`,
      );
    });

    render(<NewArrivalsStrip products={[...newestProducts, ...variedRecentProducts]} />);

    const recentHeading = screen.getByRole("heading", { name: "Recently Added" });
    const recentGrid = recentHeading.parentElement?.parentElement?.nextElementSibling;
    const recentLinks = Array.from(recentGrid?.querySelectorAll("a") || []);
    const newArrivalGrid = screen.getByRole("heading", { name: "New Arrivals" })
      .parentElement?.parentElement?.nextElementSibling;
    const newArrivalLinks = Array.from(newArrivalGrid?.querySelectorAll("a") || []);
    const categoryByProductId = new Map(
      [...newestProducts, ...variedRecentProducts].map((product) => [product.id, product.category?.slug]),
    );
    const createdAtByProductId = new Map(
      [...newestProducts, ...variedRecentProducts].map((product) => [product.id, product.created_at]),
    );
    const recentlyAddedIds = recentLinks.map((link) => link.getAttribute("href")?.split("/").pop() || "");
    const newArrivalIds = newArrivalLinks.map((link) => link.getAttribute("href")?.split("/").pop() || "");
    const recentlyAddedCategories = recentlyAddedIds.map((id) => categoryByProductId.get(id));

    expect(recentLinks).toHaveLength(8);
    expect(newArrivalLinks).toHaveLength(8);
    expect(new Set(recentlyAddedCategories).size).toBe(8);
    expect(newArrivalIds.some((id) => recentlyAddedIds.includes(id))).toBe(false);
    const recentlyAddedTimestamps = recentlyAddedIds.map((id) => Date.parse(createdAtByProductId.get(id) || ""));
    expect(recentlyAddedTimestamps).toEqual([...recentlyAddedTimestamps].sort((a, b) => b - a));
  });
});