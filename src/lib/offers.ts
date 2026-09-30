import type { Discount, Offer, OfferBanner } from "@/types";
import { getAnonClient } from "@/lib/supabase";

export function isOfferCurrentlyActive(offer: Pick<Offer, "is_active" | "start_date" | "end_date">, now = Date.now()) {
  if (!offer.is_active) return false;
  const startsAt = offer.start_date ? new Date(offer.start_date).getTime() : null;
  const endsAt = offer.end_date ? new Date(offer.end_date).getTime() : null;
  return (startsAt === null || (Number.isFinite(startsAt) && startsAt <= now))
    && (endsAt === null || (Number.isFinite(endsAt) && endsAt > now));
}

function normalizeDiscounts(discounts: unknown): Discount[] {
  if (!Array.isArray(discounts)) return [];

  return discounts.flatMap((discount) => {
    if (!discount || typeof discount !== "object") return [];

    const candidate = discount as Record<string, unknown>;
    const discountType = typeof candidate.discount_type === "string" ? candidate.discount_type : "";
    const value = typeof candidate.value === "number" ? candidate.value : Number(candidate.value);

    if (!discountType || !Number.isFinite(value)) return [];

    return [{
      id: typeof candidate.id === "string" ? candidate.id : undefined,
      offer_id: typeof candidate.offer_id === "string" ? candidate.offer_id : undefined,
      discount_type: discountType as Discount["discount_type"],
      value,
    }];
  });
}

export async function getActiveOffers(nowIso: string): Promise<Offer[]> {
  if (!nowIso) return [];

  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("offers")
      .select("id,label,description,start_date,end_date,charge_type,discounts(id,discount_type,value)")
      .eq("is_active", true)
      .lte("start_date", nowIso)
      .or(`end_date.is.null,end_date.gt.${nowIso}`);

    if (error) {
      console.error("[offers] Failed to load active offers:", error);
      return [];
    }

    const currentTime = new Date(nowIso).getTime();

    return (data ?? []).flatMap((offer) => {
      if (!offer || typeof offer !== "object") return [];

      const candidate = offer as Record<string, unknown>;
      const id = typeof candidate.id === "string" ? candidate.id : "";
      const label = typeof candidate.label === "string" ? candidate.label : "";
      const description = typeof candidate.description === "string" ? candidate.description : null;
      const startDate = typeof candidate.start_date === "string" ? candidate.start_date : null;
      const endDate = typeof candidate.end_date === "string" ? candidate.end_date : null;
      const chargeType = typeof candidate.charge_type === "string" ? candidate.charge_type : null;
      const isActive = candidate.is_active === true;

      if (!isActive || !id || !label) return [];
      if (startDate && new Date(startDate).getTime() > currentTime) return [];
      if (endDate && new Date(endDate).getTime() <= currentTime) return [];

      return [{
        id,
        label,
        description,
        is_active: true,
        start_date: startDate,
        end_date: endDate,
        charge_type: chargeType,
        discounts: normalizeDiscounts(candidate.discounts),
      }];
    });
  } catch (error) {
    console.error("[offers] Unexpected error while loading active offers:", error);
    return [];
  }
}

export async function getVisibleOfferBanners(activeOfferIds: string[]): Promise<OfferBanner[]> {
  if (!activeOfferIds || activeOfferIds.length === 0) return [];

  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("offer_banners")
      .select("id,offer_id,product_id,image_url,alt_text,display_order,updated_at")
      .eq("is_active", true)
      .in("offer_id", activeOfferIds)
      .order("display_order", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[offers] Failed to load visible offer banners:", error);
      return [];
    }

    const banners = (data ?? []).flatMap((banner) => {
      if (!banner || typeof banner !== "object") return [];

      const candidate = banner as Record<string, unknown>;
      const id = typeof candidate.id === "string" ? candidate.id : "";
      const offerId = typeof candidate.offer_id === "string" ? candidate.offer_id : null;
      const productId = typeof candidate.product_id === "string" ? candidate.product_id : null;
      const imageUrl = typeof candidate.image_url === "string" ? candidate.image_url.trim() : "";
      const altText = typeof candidate.alt_text === "string" ? candidate.alt_text.trim() : "";
      const displayOrder = typeof candidate.display_order === "number" ? candidate.display_order : Number(candidate.display_order);
      const updatedAt = typeof candidate.updated_at === "string" ? candidate.updated_at : null;

      if (!id || !offerId || !imageUrl || !altText) return [];

      return [{
        id,
        offer_id: offerId,
        product_id: productId,
        image_url: imageUrl,
        alt_text: altText,
        is_active: true,
        display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
        updated_at: updatedAt,
      }];
    });

    return banners.sort((left, right) => {
      const leftOrder = Number.isFinite(left.display_order) ? Number(left.display_order) : 0;
      const rightOrder = Number.isFinite(right.display_order) ? Number(right.display_order) : 0;
      if (leftOrder !== rightOrder) return leftOrder - rightOrder;
      return new Date(right.updated_at ?? "1970-01-01T00:00:00.000Z").getTime()
        - new Date(left.updated_at ?? "1970-01-01T00:00:00.000Z").getTime();
    });
  } catch (error) {
    console.error("[offers] Unexpected error while loading visible offer banners:", error);
    return [];
  }
}
