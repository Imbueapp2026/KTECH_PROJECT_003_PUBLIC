"use client";

import { ProductCard } from "./ProductCard";
import { ARRIVALS_CONFIG, partitionArrivals } from "@/lib/arrivals";
import type { ProductJoined } from "@/types";

interface NewArrivalsStripProps {
  products: ProductJoined[];
}

function selectCategoryDiverseProducts(products: ProductJoined[], limit: number): ProductJoined[] {
  const selected: ProductJoined[] = [];
  const selectedIds = new Set<string>();
  const selectedCategories = new Set<string>();

  for (const product of products) {
    const categoryKey = product.category_id || product.category?.id || product.category?.slug || product.id;
    if (selectedCategories.has(categoryKey)) continue;

    selected.push(product);
    selectedIds.add(product.id);
    selectedCategories.add(categoryKey);
    if (selected.length === limit) break;
  }

  if (selected.length < limit) {
    for (const product of products) {
      if (selectedIds.has(product.id)) continue;

      selected.push(product);
      if (selected.length === limit) break;
    }
  }

  return selected.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function NewArrivalsStrip({ products }: NewArrivalsStripProps) {
  const { newArrivals, recentlyArrived } = partitionArrivals(products, ARRIVALS_CONFIG);

  if (newArrivals.length === 0 && recentlyArrived.length === 0) return null;

  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {newArrivals.length > 0 && (
          <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Just in</p>
              <h2 className="text-2xl font-serif text-charcoal sm:text-3xl">New Arrivals</h2>
            </div>
            <span className="hidden text-xs text-charcoal/50 sm:block">Latest pieces, selected for you</span>
          </div>
        )}

        {newArrivals.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
            {newArrivals.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} showNewBadge />
              </div>
            ))}
          </div>
        )}

        {recentlyArrived.length > 0 && (
          <div className="mt-12 border-t border-charcoal/10 pt-8 sm:mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/50">More from the latest drops</p>
                <h3 className="font-serif text-2xl text-charcoal sm:text-3xl">Recently Arrived</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 2xl:gap-5">
              {recentlyArrived.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
