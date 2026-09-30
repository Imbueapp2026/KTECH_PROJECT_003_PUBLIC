/**
 * Admin Sync Service
 * Fetches offers, price data, and banners from admin and provides real-time updates
 * to product cards, banners, and other site components.
 */

import { getAnonClient } from "./supabase";
import { isOfferCurrentlyActive } from "./offers";
import type { RealtimeChannel } from "@supabase/supabase-js";

// Types
export interface BannerProduct {
  id: string;
  name: string;
  image_urls: string[];
  price: number;
  is_limited: boolean;
  banner_priority: number;
  status: string;
  availability: string;
  category_id?: string;
}

export interface BannerCategory {
  id: string;
  name: string;
  slug: string;
  icon_svg: string;
  is_featured: boolean;
  banner_priority: number;
}

export interface BannerData {
  products: BannerProduct[];
  categories: BannerCategory[];
}

export interface OfferData {
  id: string;
  label: string;
  description: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  applied_to_all: boolean;
  discount?: {
    id: string;
    discount_type: "percentage" | "flat";
    value: number;
  } | null;
}

export type DiscountableOffer = {
  discount?: {
    discount_type: "percentage" | "flat";
    value: number;
  } | null;
} | null | undefined;

export interface ProductWithOffer {
  id: string;
  name: string;
  price: number;
  image_urls: string[];
  category_id: string | null;
  offer_id: string | null;
  offer: OfferData | null;
  status: string;
  availability: string;
  hallmark_certified: boolean;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface SiteData {
  banners: BannerData;
  offers: OfferData[];
  products: ProductWithOffer[];
  lastUpdated: number;
}

// Cache
let cachedData: SiteData | null = null;
const subscribers: Set<(data: SiteData) => void> = new Set();
let realtimeChannels: RealtimeChannel[] = [];

/**
 * Fetch all banner data (products and categories) from admin
 */
async function fetchBannerData(): Promise<BannerData> {
  try {
    const supabase = getAnonClient();

    // Get products with banner priority
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, image_urls, price, is_limited, banner_priority, status, availability, category_id")
      .order("banner_priority", { ascending: false });

    if (productsError) {
      console.error("[AdminSync] Failed to fetch banner products:", productsError);
      return { products: [], categories: [] };
    }

    // Get featured categories
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id, name, slug, icon_svg, is_featured, banner_priority")
      .order("banner_priority", { ascending: false });

    if (categoriesError) {
      console.error("[AdminSync] Failed to fetch banner categories:", categoriesError);
      return { products: products || [], categories: [] };
    }

    return {
      products: products || [],
      categories: categories || [],
    };
  } catch (error) {
    console.error("[AdminSync] Banner data unavailable:", error);
    return { products: [], categories: [] };
  }
}

/**
 * Fetch all active offers from admin
 */
async function fetchOffers(): Promise<OfferData[]> {
  try {
    const supabase = getAnonClient();

    const { data, error } = await supabase
      .from("offers")
      .select(`
        id,
        label,
        description,
        is_active,
        start_date,
        end_date,
        applied_to_all,
        discounts(id, discount_type, value)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminSync] Failed to fetch offers:", error);
      return [];
    }

    const offers = (data || []) as unknown as Array<OfferData & { discounts?: OfferData["discount"][] }>;
    return offers.map((offer) => ({
      ...offer,
      discount: Array.isArray(offer.discounts) ? offer.discounts[0] : null,
    }));
  } catch (error) {
    console.error("[AdminSync] Offers unavailable:", error);
    return [];
  }
}

/**
 * Fetch all products with offer data
 */
async function fetchProductsWithOffers(): Promise<ProductWithOffer[]> {
  try {
    const supabase = getAnonClient();

    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        price,
        image_urls,
        category_id,
        offer_id,
        status,
        availability,
        hallmark_certified,
        created_at,
        updated_at,
        categories(id, name, slug),
        offers(id, label, description, is_active, start_date, end_date, discounts(id, discount_type, value))
      `)
      .eq("status", "published")
      .neq("availability", "sold")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[AdminSync] Failed to fetch products:", error);
      return [];
    }

    type JoinedOffer = {
      id: string;
      label: string;
      description: string | null;
      is_active: boolean;
      start_date: string | null;
      end_date: string | null;
      discounts?: OfferData["discount"][] | null;
    };
    type JoinedProduct = Record<string, unknown> & {
      offers?: JoinedOffer | JoinedOffer[] | null;
      categories?: ProductWithOffer["category"] | ProductWithOffer["category"][] | null;
    };

    return ((data || []) as unknown as JoinedProduct[]).map((item) => {
      const rawOffer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
      let offer: OfferData | null = null;

      if (rawOffer && typeof rawOffer === "object") {
        const offerObj = rawOffer;
        if (isOfferCurrentlyActive({
          is_active: offerObj.is_active === true,
          start_date: typeof offerObj.start_date === "string" ? offerObj.start_date : null,
          end_date: typeof offerObj.end_date === "string" ? offerObj.end_date : null,
        })) {
          const discounts = Array.isArray(offerObj.discounts) ? offerObj.discounts : [];
          offer = {
            id: offerObj.id,
            label: offerObj.label,
            description: offerObj.description,
            is_active: offerObj.is_active,
            start_date: offerObj.start_date,
            end_date: offerObj.end_date,
            applied_to_all: false,
            discount: discounts[0] || null,
          };
        }
      }

      return {
        ...item,
        offer,
        category: Array.isArray(item.categories) ? item.categories[0] : item.categories || null,
        categories: undefined,
        offers: undefined,
      } as unknown as ProductWithOffer;
    });
  } catch (error) {
    console.error("[AdminSync] Products unavailable:", error);
    return [];
  }
}

/**
 * Fetch all site data from admin
 */
export async function fetchAllSiteData(): Promise<SiteData> {
  console.log("[AdminSync] Fetching all site data from admin...");

  const [banners, offers, products] = await Promise.all([
    fetchBannerData(),
    fetchOffers(),
    fetchProductsWithOffers(),
  ]);

  const data: SiteData = {
    banners,
    offers,
    products,
    lastUpdated: Date.now(),
  };

  cachedData = data;
  notifySubscribers(data);

  return data;
}

/**
 * Get cached data or fetch if not available
 */
export async function getSiteData(forceRefresh = false): Promise<SiteData> {
  if (!forceRefresh && cachedData) {
    return cachedData;
  }
  return fetchAllSiteData();
}

/**
 * Subscribe to data updates
 */
export function subscribeToSiteData(callback: (data: SiteData) => void): () => void {
  subscribers.add(callback);

  // Send current data if available
  if (cachedData) {
    callback(cachedData);
  }

  // Return unsubscribe function
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Notify all subscribers of data updates
 */
function notifySubscribers(data: SiteData): void {
  subscribers.forEach((callback) => {
    try {
      callback(data);
    } catch (error) {
      console.error("[AdminSync] Error in subscriber callback:", error);
    }
  });
}

/**
 * Setup real-time subscriptions for admin changes
 */
export function setupRealtimeSync(): () => void {
  console.log("[AdminSync] Setting up realtime sync...");

  try {
    const supabase = getAnonClient();

    // Subscribe to product changes
    const productsChannel = supabase
      .channel("products-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "products",
        },
        async () => {
          console.log("[AdminSync] Products changed, refreshing data...");
          await fetchAllSiteData();
        }
      )
      .subscribe();

    // Subscribe to offer changes
    const offersChannel = supabase
      .channel("offers-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
        },
        async () => {
          console.log("[AdminSync] Offers changed, refreshing data...");
          await fetchAllSiteData();
        }
      )
      .subscribe();

    // Subscribe to category changes
    const categoriesChannel = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        async () => {
          console.log("[AdminSync] Categories changed, refreshing data...");
          await fetchAllSiteData();
        }
      )
      .subscribe();

    // Subscribe to offer_banners changes
    const offerBannersChannel = supabase
      .channel("offer-banners-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offer_banners",
        },
        async () => {
          console.log("[AdminSync] Offer banners changed, refreshing data...");
          await fetchAllSiteData();
        }
      )
      .subscribe();

    realtimeChannels = [productsChannel, offersChannel, categoriesChannel, offerBannersChannel];

    // Return cleanup function
    return () => {
      console.log("[AdminSync] Cleaning up realtime subscriptions...");
      realtimeChannels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      realtimeChannels = [];
    };
  } catch (error) {
    console.warn("[AdminSync] Realtime unavailable; continuing without live sync.", error);
    return () => {};
  }
}

/**
 * Calculate discounted price
 */
export function calculateDiscountedPrice(
  price: number,
  offer: DiscountableOffer
): number {
  if (!offer || !offer.discount) return price;

  const { discount_type, value } = offer.discount;

  if (discount_type === "percentage") {
    return Math.round(price * (1 - value / 100));
  } else {
    return Math.max(0, price - value);
  }
}

/**
 * Get banner items for Banner component
 */
export function getBannerItems(data: SiteData) {
  const items: Array<{
    id: string;
    type: "product" | "category";
    title: string;
    imageUrl: string | null;
    linkUrl: string;
    badge: string;
    data: unknown;
  }> = [];

  // Add limited products
  data.banners.products
    .filter((p) => p.is_limited && p.status === "published" && p.availability !== "sold")
    .slice(0, 2)
    .forEach((product) => {
      items.push({
        id: product.id,
        type: "product",
        title: product.name,
        imageUrl: product.image_urls?.[0] || null,
        linkUrl: `/products/${product.id}`,
        badge: "Limited",
        data: product,
      });
    });

  // Add featured categories
  data.banners.categories
    .filter((c) => c.is_featured)
    .slice(0, 2)
    .forEach((category) => {
      items.push({
        id: category.id,
        type: "category",
        title: category.name,
        imageUrl: category.icon_svg || null,
        linkUrl: `/?category=${category.slug}`,
        badge: "Featured",
        data: category,
      });
    });

  // Add latest products
  data.products
    .filter((p) => !data.banners.products.find((bp) => bp.id === p.id))
    .slice(0, 3)
    .forEach((product) => {
      items.push({
        id: product.id,
        type: "product",
        title: product.name,
        imageUrl: product.image_urls?.[0] || null,
        linkUrl: `/products/${product.id}`,
        badge: "New",
        data: product,
      });
    });

  return items.slice(0, 7);
}

/**
 * Get products with active offers
 */
export function getProductsWithActiveOffers(data: SiteData): ProductWithOffer[] {
  return data.products.filter((p) => p.offer !== null);
}

/**
 * Get featured products (limited + high priority)
 */
export function getFeaturedProducts(data: SiteData): ProductWithOffer[] {
  return data.products
    .filter((p) => {
      const isLimited = data.banners.products.find((bp) => bp.id === p.id && bp.is_limited);
      return isLimited || (p.offer !== null);
    })
    .slice(0, 10);
}
