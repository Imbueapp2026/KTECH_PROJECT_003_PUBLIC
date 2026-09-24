"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import type { Festival } from "@/types";

type OfferBanner = {
  id: string;
  offer_id: string;
  image_url: string;
  alt_text: string;
};

export function FeaturedFestivalSection() {
  const [activeFestival, setActiveFestival] = useState<Festival | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const [offerBanners, setOfferBanners] = useState<OfferBanner[]>([]);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Fetch festival and products data
  const fetchData = useCallback(async () => {
    setFetchError(false);
    try {
      // First, fetch active festival
      const festivalRes = await fetch("/api/active-festival");

      let currentFestival = null;
      if (festivalRes.ok) {
        const festivalData = await festivalRes.json();
        currentFestival = festivalData.data || null;
        setActiveFestival(currentFestival);
      }

      if (!currentFestival) {
        const bannerRes = await fetch("/api/offer-banners");
        if (bannerRes.ok) {
          const bannerData = await bannerRes.json();
          setOfferBanners(bannerData.data ?? []);
          setActiveBannerIndex(0);
        }
      } else {
        setOfferBanners([]);
      }
    } catch (error) {
      console.warn("Failed to fetch festival data:", error);
      setOfferBanners([]);
      setActiveBannerIndex(0);
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    if (activeFestival || offerBanners.length < 2) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((index) => (index + 1) % offerBanners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeFestival, offerBanners.length]);

  function moveBanner(direction: -1 | 1) {
    if (offerBanners.length < 2) return;
    setActiveBannerIndex((index) =>
      (index + direction + offerBanners.length) % offerBanners.length,
    );
  }

  // Refresh data when page becomes visible (e.g., user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchData]);

  // Periodic refresh to check for new festivals/offers
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchData();
    }, 10000); // Check every 10 seconds for new festivals/offers

    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <section className="bg-[#FBFAF8] py-7 sm:py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Festival Banner Header */}
        {activeFestival ? (
          <div className="mb-10 overflow-hidden rounded-2xl shadow-lg">
            <div 
              className="relative aspect-[4/5] sm:aspect-[16/7] min-h-[420px] sm:min-h-[220px] sm:max-h-[420px] w-full overflow-hidden"
            >
              {activeFestival.image_url ? (
                <Image
                  src={activeFestival.image_url}
                  alt={activeFestival.name}
                  fill
                  sizes="100vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-[#C9A66B] to-[#8B7355]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
                <span className="text-xs uppercase tracking-widest text-[#C9A66B] font-semibold mb-1 block">Festive Special</span>
                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white mb-2">
                  {activeFestival.name}
                </h2>
                {activeFestival.description && (
                  <p className="text-sm sm:text-base text-white/90 max-w-2xl font-light">
                    {activeFestival.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 sm:mb-7">
            <div className="mb-3 flex items-end justify-between gap-4 px-1 sm:mb-4 sm:px-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#A47B40]">Limited-time edit</p>
                <h2 className="mt-1 font-serif text-2xl text-[#2C2C2A] sm:text-4xl">Current Offers</h2>
              </div>
              {offerBanners.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous offer"
                    onClick={() => moveBanner(-1)}
                    className="flex h-9 w-9 items-center justify-center border border-[#D8CFC5] text-[#2C2C2A] transition-colors hover:bg-[#2C2C2A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B]"
                  >
                    &#8592;
                  </button>
                  <button
                    type="button"
                    aria-label="Next offer"
                    onClick={() => moveBanner(1)}
                    className="flex h-9 w-9 items-center justify-center border border-[#D8CFC5] text-[#2C2C2A] transition-colors hover:bg-[#2C2C2A] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A66B]"
                  >
                    &#8594;
                  </button>
                </div>
              )}
            </div>
            <div className="relative aspect-[4/3] min-h-[220px] w-full overflow-hidden bg-gradient-to-r from-[#C9A66B] to-[#8B7355] sm:aspect-[16/7] sm:min-h-[190px] sm:max-h-[360px]">
              {offerBanners.length > 0 && (
                <div
                  className="flex h-full w-full transition-transform duration-700 ease-out will-change-transform"
                  style={{ transform: `translate3d(-${activeBannerIndex * 100}%, 0, 0)` }}
                >
                  {offerBanners.map((banner) => (
                    <div key={banner.id} className="relative h-full min-w-full animate-[offerSlideIn_700ms_ease-out] bg-[#FAF8F5]">
                      <Image
                        src={banner.image_url}
                        alt=""
                        fill
                        sizes="100vw"
                        aria-hidden="true"
                        className="scale-105 object-cover blur-xl opacity-70"
                      />
                      <Image
                        src={banner.image_url}
                        alt={banner.alt_text}
                        fill
                        sizes="100vw"
                        priority={banner.id === offerBanners[activeBannerIndex]?.id}
                        className="object-fill"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              {offerBanners.length > 1 && (
                <div className="absolute bottom-5 right-5 z-10 flex gap-1.5 sm:bottom-7 sm:right-8" aria-label="Offer banner slides">
                  {offerBanners.map((banner, index) => (
                    <span
                      key={banner.id}
                      className={`h-1.5 w-1.5 rounded-full ${index === activeBannerIndex ? "bg-white" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              )}
              <Link
                href={offerBanners[activeBannerIndex] ? `/collections?offers=active&offer_id=${offerBanners[activeBannerIndex].offer_id}` : "/collections?offers=active"}
                className="absolute bottom-0 left-0 right-0 z-10 p-5 pb-7 focus-visible:outline-none sm:p-10 sm:pb-10"
              >
                <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E6C98F]">Special Offers</span>
                <p className="max-w-xl text-sm font-light text-white/90 sm:text-base">
                  {fetchError
                    ? "We couldn't load our offers right now"
                    : offerBanners.length > 0
                    ? "Explore exclusive pieces with special pricing"
                    : "No offers available"}
                </p>
                <span className="mt-4 inline-flex border-b border-white/80 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">Shop offer</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
