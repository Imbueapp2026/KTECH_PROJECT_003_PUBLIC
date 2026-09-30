import { getAnonClient } from "./supabase";
import type { Offer } from "@/types";

export function isOfferCurrentlyActive(offer: Pick<Offer, "is_active" | "start_date" | "end_date">, now = Date.now()) {
  if (!offer.is_active) return false;
  const startsAt = offer.start_date ? new Date(offer.start_date).getTime() : null;
  const endsAt = offer.end_date ? new Date(offer.end_date).getTime() : null;
  return (startsAt === null || (Number.isFinite(startsAt) && startsAt <= now))
    && (endsAt === null || (Number.isFinite(endsAt) && endsAt > now));
}

export interface ActiveOfferWithDiscounts extends Offer {
  charge_type: string | null;
  discounts: Array<{
    id: string;
    discount_type: "percentage" | "flat" | "making_charge";
    value: number;
  }>;
}

export interface OfferBanner {
  id: string;
  offer_id: string;
  product_id: string | null;
  image_url: string;
  alt_text: string;
  display_order: number;
  updated_at: string;
}

export async function getActiveOffers(nowIso: string): Promise<ActiveOfferWithDiscounts[]> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from('offers')
      .select('id,label,description,is_active,start_date,end_date,charge_type,discounts(id,discount_type,value)')
      .eq('is_active', true)
      .lte('start_date', nowIso)
      .or(`end_date.is.null,end_date.gt.${nowIso}`);

    if (error) {
      console.error('[offers.ts] getActiveOffers error:', error);
      return [];
    }

    return (data || []).map((row): ActiveOfferWithDiscounts => ({
      id: String(row.id),
      label: String(row.label),
      description: row.description || null,
      is_active: Boolean(row.is_active),
      start_date: row.start_date || null,
      end_date: row.end_date || null,
      charge_type: row.charge_type || null,
      discounts: Array.isArray(row.discounts) ? row.discounts.map((d: { id: unknown; discount_type: unknown; value: unknown }) => ({
        id: String(d.id),
        discount_type: d.discount_type as "percentage" | "flat" | "making_charge",
        value: Number(d.value),
      })) : [],
    }));
  } catch (err) {
    console.error('[offers.ts] getActiveOffers exception:', err);
    return [];
  }
}

export async function getVisibleOfferBanners(activeOfferIds: string[]): Promise<OfferBanner[]> {
  if (activeOfferIds.length === 0) {
    return [];
  }

  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from('offer_banners')
      .select('id,offer_id,product_id,image_url,alt_text,display_order,updated_at')
      .eq('is_active', true)
      .in('offer_id', activeOfferIds)
      .order('display_order', { ascending: true })
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[offers.ts] getVisibleOfferBanners error:', error);
      return [];
    }

    return (data || [])
      .map((row: { id: unknown; offer_id: unknown; product_id: unknown; image_url: unknown; alt_text: unknown; display_order: unknown; updated_at: unknown }): OfferBanner => ({
        id: String(row.id),
        offer_id: String(row.offer_id),
        product_id: row.product_id ? String(row.product_id) : null,
        image_url: String(row.image_url),
        alt_text: String(row.alt_text),
        display_order: Number(row.display_order),
        updated_at: String(row.updated_at),
      }))
      .filter((banner) => 
        banner.image_url.trim() !== '' && 
        banner.alt_text.trim() !== ''
      );
  } catch (err) {
    console.error('[offers.ts] getVisibleOfferBanners exception:', err);
    return [];
  }
}
