/**
 * GET /api/offers — Public active-offer and banner payload for the festive/offers banner.
 */
import { handlePreflight, withCors } from "@/lib/cors";
import { getActiveOffers, getVisibleOfferBanners } from "@/lib/offers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const preflight = handlePreflight(req, { origin: "*" });
  if (preflight) return preflight;

  try {
    const nowIso = new Date().toISOString();
    const offers = await getActiveOffers(nowIso);
    const visibleOfferIds = offers.map((offer) => offer.id);
    const banners = await getVisibleOfferBanners(visibleOfferIds);

    const response = Response.json(
      { offers, banners },
      { headers: { "Cache-Control": "no-store" } },
    );

    return withCors(response, req, { origin: "*" });
  } catch (error) {
    console.error("[API] GET /api/offers error:", error);
    return withCors(
      Response.json({ offers: [], banners: [] }, { headers: { "Cache-Control": "no-store" } }),
      req,
      { origin: "*" },
    );
  }
}