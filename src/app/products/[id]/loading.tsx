"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatStoredRupees, getOfferDiscountTypeLabel } from "@/lib/utils";
import { getProductNavigationPreview } from "@/lib/product-navigation-cache";

export default function ProductLoading() {
  const { id } = useParams<{ id: string }>();
  const preview = getProductNavigationPreview(id);
  const hasOffer = Boolean(preview?.offerId)
    && preview?.offerPrice !== null
    && preview?.offerPrice !== undefined;
  const discountTypeLabel = getOfferDiscountTypeLabel(preview?.offerDiscountType);

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 pb-12 sm:pb-16 px-3 sm:px-4 md:px-8" aria-busy="true">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/collections"
          className="text-charcoal/80 mb-6 inline-flex items-center gap-1.5 text-sm font-medium"
        >
          <span aria-hidden="true">←</span>
          Back to collections
        </Link>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 p-4 sm:p-6 md:p-8">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {preview?.imageUrl ? (
                <Image
                  src={preview.imageUrl}
                  alt={preview.name}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
              )}
              {hasOffer && preview?.offerDiscountAmount !== null && preview?.offerDiscountAmount !== undefined && (
                <div className="absolute top-4 right-4 bg-gold text-white px-3 py-1 rounded text-sm font-semibold">
                  {formatStoredRupees(preview.offerDiscountAmount)} OFF{discountTypeLabel ? ` - ${discountTypeLabel}` : ""}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="mb-4">
                {preview ? (
                  <p className="text-sm text-charcoal/70 uppercase tracking-wide mb-2">{preview.categoryName}</p>
                ) : (
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2" />
                )}
                {preview ? (
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-2 leading-tight">{preview.name}</h1>
                ) : (
                  <div className="h-9 w-4/5 bg-gray-200 rounded animate-pulse mb-2" />
                )}
                <div className="h-5 w-24 bg-gray-100 rounded animate-pulse mt-2" />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-charcoal/70 mb-1">Price</p>
                <div className="flex items-baseline gap-2">
                  {preview ? (
                    <>
                      {hasOffer && <span className="text-2xl sm:text-3xl font-bold text-charcoal">{formatStoredRupees(preview.offerPrice!)}</span>}
                      <span className={`${hasOffer ? "text-lg text-charcoal/40 line-through" : "text-2xl sm:text-3xl font-bold text-charcoal"}`}>
                        {formatStoredRupees(preview.price)}
                      </span>
                    </>
                  ) : (
                    <div className="h-9 w-32 bg-gray-200 rounded animate-pulse" />
                  )}
                </div>
                <div className="h-3 w-28 bg-gray-100 rounded animate-pulse mt-2" />
              </div>

              <div className="min-h-32 bg-[#FAF8F5] border-l-4 border-gold p-5 mb-6 rounded-r-lg">
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-2" />
                <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}