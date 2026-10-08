import type { ProductJoined } from "@/types";
import { ARRIVALS_CONFIG, partitionArrivals } from "@/lib/arrivals";

export type ProductRealtimeEventType = "INSERT" | "UPDATE" | "DELETE";

export interface ProductRealtimePayload {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export function reconcileProductRealtimeEvent(
  products: ProductJoined[],
  eventType: ProductRealtimeEventType,
  payload: ProductRealtimePayload,
): ProductJoined[] {
  const record = eventType === "DELETE" ? payload.old : payload.new;
  const productId = typeof record.id === "string" ? record.id : null;
  if (!productId) return products;

  if (eventType === "DELETE" || payload.new.status !== "published") {
    return products.filter((product) => product.id !== productId);
  }

  const existing = products.find((product) => product.id === productId);
  const updatedProduct = {
    ...existing,
    ...payload.new,
    id: productId,
    created_at: existing?.created_at ?? payload.new.created_at,
    category: existing?.category ?? null,
    offer: existing?.offer ?? null,
  } as ProductJoined;
  const nextProducts = existing
    ? products.map((product) => product.id === productId ? updatedProduct : product)
    : [...products, updatedProduct];
  const { newArrivals, recentlyArrived } = partitionArrivals(nextProducts, ARRIVALS_CONFIG);

  return [...newArrivals, ...recentlyArrived];
}