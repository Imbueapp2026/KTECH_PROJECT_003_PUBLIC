import { getAnonClient } from "@/lib/supabase";
import { serverError } from "@/lib/http";

export async function GET() {
  const { data, error } = await getAnonClient()
    .from("offer_banners")
    .select("id, image_url, alt_text, display_order, product_id, products!inner(id), offers!inner(label)")
    .eq("is_active", true)
    .eq("offers.is_active", true)
    .eq("products.status", "published")
    .order("display_order", { ascending: true });

  if (error) return serverError(error);
  return Response.json({ data: data ?? [] }, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}