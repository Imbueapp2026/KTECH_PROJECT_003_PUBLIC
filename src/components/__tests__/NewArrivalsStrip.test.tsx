import { describe, expect, it, vi } from "vitest";
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

function mockMotion(reducedMotion: boolean) {
  const animateDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
  const matchMediaDescriptor = Object.getOwnPropertyDescriptor(window, "matchMedia");
  const animate = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({ matches: reducedMotion }),
  });

  return {
    animate,
    restore() {
      if (animateDescriptor) Object.defineProperty(HTMLElement.prototype, "animate", animateDescriptor);
      else Reflect.deleteProperty(HTMLElement.prototype, "animate");
      if (matchMediaDescriptor) Object.defineProperty(window, "matchMedia", matchMediaDescriptor);
      else Reflect.deleteProperty(window, "matchMedia");
    },
  };
}

describe("NewArrivalsStrip", () => {
  it("shows the newest eight products and the next eight, regardless of age", () => {
    const products = Array.from({ length: 17 }, (_, index) =>
      createProduct(`product-${index}`, 100 + index),
    );

    render(<NewArrivalsStrip products={products} />);

    expect(screen.getByRole("heading", { name: "New Arrivals" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Recently Arrived" })).toBeInTheDocument();
    expect(screen.getByText("product-0")).toBeInTheDocument();
    expect(screen.getByText("product-15")).toBeInTheDocument();
    expect(screen.queryByText("product-16")).not.toBeInTheDocument();
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

  it("animates realtime inserts but not the initial load", () => {
    const motion = mockMotion(false);
    try {
      const products = Array.from({ length: 8 }, (_, index) => createProduct(`initial-${index}`, 100 + index));
      const { rerender } = render(<NewArrivalsStrip products={products} animationKey={0} />);

      expect(motion.animate).not.toHaveBeenCalled();
      rerender(<NewArrivalsStrip products={[...products, createProduct("inserted", 0)]} animationKey={1} />);

      expect(motion.animate).toHaveBeenCalled();
    } finally {
      motion.restore();
    }
  });

  it("skips realtime motion when reduced motion is preferred", () => {
    const motion = mockMotion(true);
    try {
      const products = Array.from({ length: 8 }, (_, index) => createProduct(`initial-${index}`, 100 + index));
      const { rerender } = render(<NewArrivalsStrip products={products} animationKey={0} />);
      rerender(<NewArrivalsStrip products={[...products, createProduct("inserted", 0)]} animationKey={1} />);

      expect(motion.animate).not.toHaveBeenCalled();
    } finally {
      motion.restore();
    }
  });
});