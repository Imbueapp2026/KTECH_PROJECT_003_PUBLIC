import type { ProductJoined } from "@/types";

export const NEW_ARRIVALS_COUNT = 8;
export const RECENT_ROWS = 3;
export const RECENT_PER_ROW = 8;
export const RECENT_COUNT = RECENT_ROWS * RECENT_PER_ROW;

export interface ArrivalsConfig {
  newArrivalsCount: number;
  recentCount: number;
}

export const ARRIVALS_CONFIG: ArrivalsConfig = {
  newArrivalsCount: NEW_ARRIVALS_COUNT,
  recentCount: RECENT_COUNT,
};

export function partitionArrivals(
  products: ProductJoined[],
  config: ArrivalsConfig,
): { newArrivals: ProductJoined[]; recentlyArrived: ProductJoined[] } {
  const rankedProducts = products
    .filter((product) => product.status === "published")
    .sort((left, right) => {
      const createdAtDifference = Date.parse(right.created_at) - Date.parse(left.created_at);
      return createdAtDifference || left.id.localeCompare(right.id);
    });

  return {
    newArrivals: rankedProducts.slice(0, config.newArrivalsCount),
    recentlyArrived: rankedProducts.slice(
      config.newArrivalsCount,
      config.newArrivalsCount + config.recentCount,
    ),
  };
}