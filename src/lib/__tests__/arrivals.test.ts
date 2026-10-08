import { describe, expect, it } from "vitest";
import type { ProductJoined } from "@/types";
import {
  ARRIVALS_CONFIG,
  NEW_ARRIVALS_COUNT,
  RECENT_COUNT,
  partitionArrivals,
} from "../arrivals";

function createProducts(count: number, createdAt = "2026-10-08T12:00:00.000Z"): ProductJoined[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `product-${String(index + 1).padStart(3, "0")}`,
    name: `Product ${index + 1}`,
    description: "",
    price: 100,
    category_id: "category-1",
    category: null,
    availability: "available",
    status: "published",
    offer_id: null,
    created_at: createdAt,
    updated_at: createdAt,
    image_urls: [],
    hallmark_certified: false,
  }));
}

describe("partitionArrivals", () => {
  it.each([0, 5, 8, 9, 32, 33, 40])("partitions %i products without overlap", (count) => {
    const products = createProducts(count);
    const { newArrivals, recentlyArrived } = partitionArrivals(products, ARRIVALS_CONFIG);
    const combinedIds = [...newArrivals, ...recentlyArrived].map((product) => product.id);

    expect(newArrivals).toHaveLength(Math.min(count, NEW_ARRIVALS_COUNT));
    expect(recentlyArrived).toHaveLength(Math.min(Math.max(count - NEW_ARRIVALS_COUNT, 0), RECENT_COUNT));
    expect(new Set(combinedIds).size).toBe(combinedIds.length);
    expect(combinedIds).toHaveLength(Math.min(count, NEW_ARRIVALS_COUNT + RECENT_COUNT));
  });

  it("uses id as a deterministic tiebreaker for identical timestamps", () => {
    const products = createProducts(3).reverse();
    const { newArrivals } = partitionArrivals(products, { newArrivalsCount: 2, recentCount: 1 });

    expect(newArrivals.map((product) => product.id)).toEqual(["product-001", "product-002"]);
  });

  it("keeps products ranked after 100 days have passed", () => {
    const products = createProducts(3, "2026-06-30T12:00:00.000Z");
    const { newArrivals, recentlyArrived } = partitionArrivals(products, ARRIVALS_CONFIG);

    expect(newArrivals.map((product) => product.id)).toEqual(products.map((product) => product.id));
    expect(recentlyArrived).toHaveLength(0);
  });

  it("moves the ninth product into Recently Arrived", () => {
    const products = createProducts(9);
    const { newArrivals, recentlyArrived } = partitionArrivals(products, ARRIVALS_CONFIG);

    expect(newArrivals).toHaveLength(8);
    expect(recentlyArrived.map((product) => product.id)).toEqual(["product-009"]);
  });

  it("drops products older than the 32-product stack", () => {
    const products = createProducts(33);
    const { newArrivals, recentlyArrived } = partitionArrivals(products, ARRIVALS_CONFIG);

    expect([...newArrivals, ...recentlyArrived].some((product) => product.id === "product-033")).toBe(false);
  });

  it("sorts the newest products first", () => {
    const products = createProducts(3).map((product, index) => ({
      ...product,
      created_at: `2026-10-0${index + 1}T12:00:00.000Z`,
    }));
    const { newArrivals } = partitionArrivals(products.reverse(), ARRIVALS_CONFIG);

    expect(newArrivals.map((product) => product.id)).toEqual(["product-003", "product-002", "product-001"]);
  });
});