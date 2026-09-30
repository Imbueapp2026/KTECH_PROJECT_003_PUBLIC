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
    const banners = await getVisibleOfferBanners(offers.map((offer) => offer.id));
    return withCors(
      Response.json({ data: banners }, { headers: { "Cache-Control": "no-store" } }),
      req,
      { origin: "*" },
    );
  } catch (error) {
    console.error("[API] Offer banners query error:", error);
    return withCors(
      Response.json({ data: [] }, { headers: { "Cache-Control": "no-store" } }),
      req,
      { origin: "*" },
    );
  }
}