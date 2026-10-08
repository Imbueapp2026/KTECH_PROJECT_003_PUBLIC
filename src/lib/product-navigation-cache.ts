import type { ProductJoined } from "@/types";

export interface ProductNavigationPreview {
  id: string;
  name: string;
  imageUrl: string | null;
  price: number;
  offerId: string | null;
  offerPrice: number | string | null;
  offerDiscountAmount: number | string | null;
  offerDiscountType: ProductJoined["offer_discount_type"];
  categoryName: string;
}

const MAX_PREVIEWS = 32;
const previews = new Map<string, ProductNavigationPreview>();

export function cacheProductNavigationPreview(product: ProductJoined): void {
  previews.delete(product.id);
  previews.set(product.id, {
    id: product.id,
    name: product.name,
    imageUrl: product.image_urls?.[0] ?? null,
    price: product.price,
    offerId: product.offer_id,
    offerPrice: product.offer_price ?? null,
    offerDiscountAmount: product.offer_discount_amount ?? null,
    offerDiscountType: product.offer_discount_type,
    categoryName: product.category?.name ?? "Uncategorized",
  });

  if (previews.size > MAX_PREVIEWS) {
    const oldestId = previews.keys().next().value;
    if (oldestId) previews.delete(oldestId);
  }
}

export function getProductNavigationPreview(id: string): ProductNavigationPreview | null {
  return previews.get(id) ?? null;
}