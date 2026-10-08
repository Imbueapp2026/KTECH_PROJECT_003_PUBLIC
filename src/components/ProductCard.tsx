"use client";
import Link from "next/link";
import Image from "next/image";
import { formatStoredRupees, getOfferDiscountTypeLabel } from "@/lib/utils";
import type { ProductJoined } from "@/types";

interface ProductCardProps {
  product: ProductJoined;
  touchZoom?: boolean;
  showNewBadge?: boolean;
}

export function ProductCard({ product, showNewBadge = false }: ProductCardProps) {
  const imageUrl = product.image_urls?.[0];
  const hasOffer = Boolean(product.offer_id) && product.offer_price !== null && product.offer_price !== undefined;
  const hasOfferLabel = hasOffer && product.offer_discount_amount !== null && product.offer_discount_amount !== undefined;
  const discountTypeLabel = getOfferDiscountTypeLabel(product.offer_discount_type);

  return (
    <Link
      href={`/products/${product.id}`}
      className="block h-full group"
    >
      <div className="relative flex h-full flex-col bg-white rounded-sm overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-shadow">
        <div className="flex min-h-7 flex-wrap content-center items-center gap-1.5 px-2 py-1">
          {product.hallmark_certified && (
            <span className="inline-flex items-center rounded-full bg-gold px-2 py-1 text-[10px] font-medium leading-3 text-charcoal">
              Hallmark
            </span>
          )}
          {showNewBadge && (
            <span className="inline-flex items-center rounded-full bg-dustyRose px-2 py-1 text-[10px] font-medium leading-3 text-charcoal">
              New
            </span>
          )}
        </div>

        <div className="aspect-square shrink-0 overflow-hidden border-b-2 border-gold bg-[#FAF8F5]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              width={500}
              height={500}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="h-full w-full object-contain p-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal/40 text-xs">
              No Image
            </div>
          )}
        </div>

        {hasOfferLabel && (
          <div className="offer-strip flex min-h-9 items-center justify-center bg-[#8A5A61] px-2 py-1 text-center text-white">
            <span className="flex w-full min-w-0 flex-col items-center break-words text-[10px] font-semibold leading-[14px] tracking-normal">
              <span className="w-full">{formatStoredRupees(product.offer_discount_amount!)} OFF</span>
              {discountTypeLabel && <span className="w-full">{discountTypeLabel}</span>}
            </span>
          </div>
        )}

        <div className="relative flex flex-1 flex-col px-2 py-3.5">
          <p className="h-[17px] overflow-hidden text-[11px] text-charcoal tracking-widest uppercase mb-1 font-medium line-clamp-1">
            {product.category?.name || "Uncategorized"}
          </p>
          <h3 className="h-[52px] overflow-hidden font-serif text-[16px] font-medium text-charcoal leading-relaxed mb-1.5 line-clamp-2 group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          {product.description && (
            <p className="mb-2 text-[12px] leading-relaxed text-charcoal/70 line-clamp-2">
              {product.description}
            </p>
          )}
          <div className="mt-auto flex items-baseline gap-2">
            {hasOffer ? (
              <>
                <span className="text-[12px] text-charcoal/50 line-through">
                  {formatStoredRupees(product.price)}
                </span>
                <span className="text-[15px] font-medium text-charcoal">
                  {formatStoredRupees(product.offer_price!)}
                </span>
              </>
            ) : (
              <span className="text-[15px] font-medium text-charcoal">
                {formatStoredRupees(product.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

