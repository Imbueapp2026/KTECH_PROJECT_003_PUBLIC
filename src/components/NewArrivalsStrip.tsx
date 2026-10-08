"use client";

import { useLayoutEffect, useRef } from "react";
import { ProductCard } from "./ProductCard";
import { ARRIVALS_CONFIG, partitionArrivals } from "@/lib/arrivals";
import type { ProductJoined } from "@/types";

interface NewArrivalsStripProps {
  products: ProductJoined[];
  animationKey?: number;
}

export function NewArrivalsStrip({ products, animationKey = 0 }: NewArrivalsStripProps) {
  const cardNodesRef = useRef(new Map<string, HTMLElement>());
  const previousPositionsRef = useRef<Map<string, DOMRect> | null>(null);
  const { newArrivals, recentlyArrived } = partitionArrivals(products, ARRIVALS_CONFIG);

  useLayoutEffect(() => {
    const previousPositions = previousPositionsRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (previousPositions && !reducedMotion) {
      for (const [productId, node] of cardNodesRef.current) {
        if (typeof node.animate !== "function") continue;
        const previous = previousPositions.get(productId);
        const current = node.getBoundingClientRect();

        if (previous) {
          const deltaX = previous.left - current.left;
          const deltaY = previous.top - current.top;
          if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) continue;
          node.animate(
            [
              { transform: `translate(${deltaX}px, ${deltaY}px)`, opacity: 0.9 },
              { transform: "translate(0, 0)", opacity: 1 },
            ],
            { duration: 400, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
          );
        } else {
          node.animate(
            [
              { transform: "translateY(8px)", opacity: 0 },
              { transform: "translateY(0)", opacity: 1 },
            ],
            { duration: 400, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" },
          );
        }
      }
    }
  }, [animationKey]);

  useLayoutEffect(() => () => {
    previousPositionsRef.current = new Map(
      [...cardNodesRef.current].map(([productId, node]) => [productId, node.getBoundingClientRect()]),
    );
  }, [products, animationKey]);

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
              <div
                key={product.id}
                ref={(node) => {
                  if (node) cardNodesRef.current.set(product.id, node);
                  else cardNodesRef.current.delete(product.id);
                }}
                className="relative"
              >
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
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-7">
              {recentlyArrived.map((product) => (
                <div
                  key={product.id}
                  ref={(node) => {
                    if (node) cardNodesRef.current.set(product.id, node);
                    else cardNodesRef.current.delete(product.id);
                  }}
                  className="relative"
                >
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
