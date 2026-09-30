import { getAnonClient } from "@/lib/supabase";
import { serverError } from "@/lib/http";
import { isOfferCurrentlyActive } from "@/lib/offers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = getAnonClient();

  // Fetch ALL banners (including inactive ones) for debugging
  const { data, error } = await supabase
    .from("offer_banners")
    .select("id, offer_id, image_url, alt_text, display_order, product_id, is_active, offers(is_active, start_date, end_date)")
    .order("display_order", { ascending: true });

  if (error) {
    console.error('[API] Offer banners query error:', error);
    return serverError(error);
  }

  console.log('[API] All banners in DB:', JSON.stringify(data, null, 2));

  // Show all banners for debugging, but mark which are active
  const allBanners = (data ?? []).map((banner) => {
    const offer = Array.isArray(banner.offers) ? banner.offers[0] : banner.offers;
    const hasOffer = !!banner.offer_id;
    const offerExists = !!offer;
    const offerIsActive = offerExists && offer.is_active === true;
    const offerCurrentlyActive = offerIsActive && isOfferCurrentlyActive(offer);
    const bannerIsActive = banner.is_active === true;

    console.log('[API] Banner', banner.id, {
      bannerIsActive,
      hasOffer,
      offerExists,
      offerIsActive,
      offerCurrentlyActive,
      offerStart: offer?.start_date,
      offerEnd: offer?.end_date,
    });

    return {
      ...banner,
      _debug: {
        bannerIsActive,
        hasOffer,
        offerExists,
        offerIsActive,
        offerCurrentlyActive,
      },
    };
  });

  // For now, return all banners to debug - filter on client side later
  return Response.json({ data: allBanners });
}