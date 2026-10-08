"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { NewArrivalsStrip } from "./NewArrivalsStrip";
import { BentoCategoryGrid } from "./BentoCategoryGrid";
import { ShopByPrice } from "./ShopByPrice";
import type { ProductJoined } from "@/types";
import { useRealtimeAdminChanges } from "@/hooks/useRealtimeAdminChanges";
import { useRealtimeProducts } from "@/hooks/useRealtimeProducts";
import { reconcileProductRealtimeEvent } from "@/lib/realtime-arrivals";
import type { ProductChangeHandler } from "@/lib/realtime";

export function HomeProductsSection() {
  const [products, setProducts] = useState<ProductJoined[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const requestVersionRef = useRef(0);

  const fetchProducts = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    try {
      const response = await fetch('/api/products?sort=created_at&order=desc&limit=32&include_sold=true', {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Product request failed: ${response.status}`);
      const result = await response.json();
      if (!Array.isArray(result.data)) throw new Error("Product response did not contain a list");
      if (requestVersion !== requestVersionRef.current) return;
      setProducts(result.data);
      setFetchError(false);
    } catch {
      if (requestVersion === requestVersionRef.current) setFetchError(true);
    } finally {
      if (requestVersion === requestVersionRef.current) setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchProducts();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  // Realtime: refresh when admin adds/edits products, offers, or pricing
  useRealtimeAdminChanges(
    ['offers', 'discounts'],
    fetchProducts,
  );

  const handleProductChange = useCallback<ProductChangeHandler>((payload) => {
    setProducts((current) => reconcileProductRealtimeEvent(current, "UPDATE", payload));
    void fetchProducts();
  }, [fetchProducts]);

  const handleProductInsert = useCallback<ProductChangeHandler>((payload) => {
    setProducts((current) => reconcileProductRealtimeEvent(current, "INSERT", payload));
    void fetchProducts();
  }, [fetchProducts]);

  const handleProductDelete = useCallback<ProductChangeHandler>((payload) => {
    setProducts((current) => reconcileProductRealtimeEvent(current, "DELETE", payload));
    void fetchProducts();
  }, [fetchProducts]);

  const refreshAfterReconnect = useCallback(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useRealtimeProducts(handleProductInsert, handleProductChange, handleProductDelete, refreshAfterReconnect);

  if (loading) {
    return (
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 bg-gray-100 rounded w-48 mb-8 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-sm overflow-hidden p-2 border border-gray-100">
                <div className="aspect-square bg-[#FAF8F5] animate-pulse rounded-sm" />
                <div className="px-1 py-3.5 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {fetchError && (
        <div role="alert" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm text-[#8A5A61] sm:px-6 lg:px-8">
          <span>Product updates could not be loaded. Showing the last available products.</span>
          <button type="button" onClick={() => void fetchProducts()} className="shrink-0 underline underline-offset-2">
            Retry
          </button>
        </div>
      )}
      {/* New Arrivals Strip */}
      <NewArrivalsStrip products={products} />
      
      {/* Bento Category Grid */}
      <BentoCategoryGrid products={products} />

      {/* Independent price-band discovery */}
      <ShopByPrice />
    </>
  );
}
