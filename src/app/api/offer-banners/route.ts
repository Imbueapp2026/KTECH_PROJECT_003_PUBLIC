import { getAnonClient } from "@/lib/supabase";
import { serverError } from "@/lib/http";
import { isOfferCurrentlyActive } from "@/lib/offers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getAnonClient();

  // Fetch all active banners with their offer data (left join to include banners without offers)
  const { data, error } = await supabase
    .from("offer_banners")
    .select("id, offer_id, image_url, alt_text, display_order, product_id, offers(is_active, start_date, end_date)")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error('[API] Offer banners query error:', error);
    return serverError(error);
  }

  console.log('[API] Raw banners data:', JSON.stringify(data, null, 2));

  // Filter to only show banners with active offers
  const activeBanners = (data ?? []).filter((banner) => {
    // If no offer linked, don't show
    if (!banner.offer_id) return false;

    const offer = Array.isArray(banner.offers) ? banner.offers[0] : banner.offers;
    console.log('[API] Banner', banner.id, 'offer:', offer);

    // If offer doesn't exist or is inactive, don't show
    if (!offer || !offer.is_active) return false;

    const isActive = isOfferCurrentlyActive(offer);
    console.log('[API] Banner', banner.id, 'isCurrentlyActive:', isActive);
    return isActive;
  });

  console.log('[API] Active banners count:', activeBanners.length);

  return Response.json({ data: activeBanners });
}