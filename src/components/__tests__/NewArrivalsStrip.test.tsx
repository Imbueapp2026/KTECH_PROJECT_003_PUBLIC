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
  it("shows the newest eight products and the next 24, regardless of age", () => {
    const products = Array.from({ length: 33 }, (_, index) =>
      createProduct(`product-${index}`, 100 + index),
    );

    render(<NewArrivalsStrip products={products} />);

    expect(screen.getByRole("heading", { name: "New Arrivals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently Arrived" })).toBeInTheDocument();
    expect(screen.getByText("product-0")).toBeInTheDocument();
    expect(screen.getByText("product-31")).toBeInTheDocument();
    expect(screen.queryByText("product-32")).not.toBeInTheDocument();
    expect(screen.getAllByText("New")).toHaveLength(8);
  });

  it("hides Recently Arrived until a ninth published product exists", () => {
    render(<NewArrivalsStrip products={Array.from({ length: 8 }, (_, index) => createProduct(`few-${index}`, 100))} />);

    expect(screen.getByRole("heading", { name: "New Arrivals" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recently Arrived" })).not.toBeInTheDocument();
  });

  it("does not render empty section headings", () => {
    const { container } = render(<NewArrivalsStrip products={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});