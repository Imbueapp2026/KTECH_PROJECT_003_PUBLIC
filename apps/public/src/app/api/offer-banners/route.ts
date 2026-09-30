/**
 * GET /api/offer-banners — public endpoint for active offer banners
 * Returns banners for currently active offers only
 */
import { getActiveOffers, getVisibleOfferBanners } from "@/lib/offers";
import { handlePreflight, withCors } from "@/lib/cors";

export async function GET(req: Request) {
  const preflight = handlePreflight(req, { origin: '*' });
  if (preflight) return preflight;

  try {
    const nowIso = new Date().toISOString();
    
    const activeOffers = await getActiveOffers(nowIso);
    const activeOfferIds = activeOffers.map(o => o.id);
    
    const banners = await getVisibleOfferBanners(activeOfferIds);
    
    const response = Response.json({ 
      offers: activeOffers,
      banners 
    }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
    });
    return withCors(response, req, { origin: '*' });
  } catch (error) {
    console.error('[API] GET /api/offer-banners error:', error);
    const response = Response.json({ offers: [], banners: [] }, {
      headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' }
    });
    return withCors(response, req, { origin: '*' });
  }
}
