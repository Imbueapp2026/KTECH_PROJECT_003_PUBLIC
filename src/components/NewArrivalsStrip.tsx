"use client";

import { ProductCard } from "./ProductCard";
import { isNewArrival } from "@/lib/utils";
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
  const publishedProducts = products
    .filter((p) => p.status === "published" && !p.festival_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const newArrivalProducts = publishedProducts.filter((product) => isNewArrival(product.created_at));
  const newProducts = selectCategoryDiverseProducts(newArrivalProducts, 8);
  const newProductIds = new Set(newProducts.map((product) => product.id));
  const remainingNewArrivals = newArrivalProducts.filter((product) => !newProductIds.has(product.id));
  const recentlyAddedProducts = selectCategoryDiverseProducts(remainingNewArrivals, 8);

  if (newProducts.length === 0 && recentlyAddedProducts.length === 0) {
    return (
      <section className="bg-white py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-serif text-charcoal mb-6">New Arrivals</h2>
          <div className="bg-gray-50 rounded-lg p-12 text-center">
            <p className="text-charcoal/70">New pieces coming soon</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 sm:mb-8">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">Just in</p>
            <h2 className="text-2xl font-serif text-charcoal sm:text-3xl">New Arrivals</h2>
          </div>
          <span className="hidden text-xs text-charcoal/50 sm:block">Latest pieces, selected for you</span>
        </div>
        
        {newProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
            {newProducts.map((product) => (
              <div key={product.id} className="relative">
                <ProductCard product={product} touchZoom />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-charcoal/70">New pieces coming soon</p>
          </div>
        )}

        {recentlyAddedProducts.length > 0 && (
          <div className="mt-12 border-t border-charcoal/10 pt-8 sm:mt-14">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal/50">Before the latest drop</p>
                <h3 className="font-serif text-2xl text-charcoal sm:text-3xl">Recently Added</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
              {recentlyAddedProducts.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} touchZoom />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
