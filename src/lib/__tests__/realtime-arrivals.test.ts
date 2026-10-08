import { describe, expect, it } from "vitest";
import type { ProductJoined } from "@/types";
import { reconcileProductRealtimeEvent } from "../realtime-arrivals";

function createProducts(count: number): ProductJoined[] {
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
    created_at: "2026-10-08T12:00:00.000Z",
    updated_at: "2026-10-08T12:00:00.000Z",
    image_urls: [],
    hallmark_certified: false,
  }));
}

describe("reconcileProductRealtimeEvent", () => {
  it("adds an inserted published product once and re-ranks the stack", () => {
    const products = createProducts(8);
    const inserted = {
      ...createProducts(1)[0],
      id: "product-009",
      name: "Product 9",
      created_at: "2026-10-09T12:00:00.000Z",
    };
    const payload = { new: { ...inserted }, old: {} };
    const withInsert = reconcileProductRealtimeEvent(products, "INSERT", payload);
    const duplicateInsert = reconcileProductRealtimeEvent(withInsert, "INSERT", payload);

    expect(withInsert[0].id).toBe(inserted.id);
    expect(duplicateInsert.filter((product) => product.id === inserted.id)).toHaveLength(1);
    expect(duplicateInsert.at(-1)?.id).toBe("product-008");
  });

  it("updates product fields without changing its rank", () => {
    const products = createProducts(3);
    const target = products[1];
    const updated = reconcileProductRealtimeEvent(products, "UPDATE", {
      new: { ...target, price: 250, created_at: "2027-01-01T12:00:00.000Z" },
      old: target as unknown as Record<string, unknown>,
    });

    expect(updated.map((product) => product.id)).toEqual(products.map((product) => product.id));
    expect(updated[1].price).toBe(250);
    expect(updated[1].created_at).toBe(target.created_at);
  });

  it("removes a product when an update unpublishes it", () => {
    const products = createProducts(3);
    const target = products[1];
    const updated = reconcileProductRealtimeEvent(products, "UPDATE", {
      new: { ...target, status: "draft" },
      old: target as unknown as Record<string, unknown>,
    });

    expect(updated.map((product) => product.id)).toEqual([products[0].id, products[2].id]);
  });

  it("removes a deleted product from the stack", () => {
    const products = createProducts(3);
    const target = products[1];
    const updated = reconcileProductRealtimeEvent(products, "DELETE", {
      new: {},
      old: { id: target.id },
    });

    expect(updated.map((product) => product.id)).toEqual([products[0].id, products[2].id]);
  });
});