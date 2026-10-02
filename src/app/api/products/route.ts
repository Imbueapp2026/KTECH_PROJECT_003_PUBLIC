/**
 * GET /api/products — public read-only endpoint for products
 * Returns published products with category and offer information.
 * Supports category filter, offer filter, price sorting, and pagination.
 */
import { getAnonClient } from "@/lib/supabase";
import { badRequest, serverError } from "@/lib/http";
import { handlePreflight, withCors } from "@/lib/cors";
import { normalizeProductOffer } from "@/lib/offers";
import { NEW_ARRIVAL_DAYS } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  // Handle preflight request
  const preflight = handlePreflight(req, { origin: '*' });
  if (preflight) return preflight;
  try {
    const url = new URL(req.url);
    const category_id = url.searchParams.get("category_id");
    const offer_id = url.searchParams.get("offer_id");
    const minPrice = Number(url.searchParams.get("minPrice"));
    const maxPrice = Number(url.searchParams.get("maxPrice"));
    const new_only = url.searchParams.get("new_only") === "true";
    const sort = url.searchParams.get("sort") || "created_at";
    const order = url.searchParams.get("order") || "desc";
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
    const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

    // Validate sort parameter
    const validSortFields = ["created_at", "price", "name"];
    if (!validSortFields.includes(sort)) {
      return badRequest(`Invalid sort field. Must be one of: ${validSortFields.join(", ")}`);
    }

    // Validate order parameter
    if (order !== "asc" && order !== "desc") {
      return badRequest("Invalid order parameter. Must be 'asc' or 'desc'");
    }

    const supabase = getAnonClient();

    let query = supabase
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        offer_price,
        offer_discount_amount,
        offer_discount_type,
        image_urls,
        availability,
        hallmark_certified,
        status,
        category_id,
        offer_id,
        material_type,
        weight_grams,
        net_weight_grams,
        purity_carats,
        created_at,
        updated_at,
        categories (id, name, slug, icon_svg),
        offers (id, label, description, is_active, start_date, end_date, discounts(id, discount_type, value))
      `)
      .eq("status", "published")
      .neq("availability", "sold");

    // Apply category filter
    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    // Apply offer filter
    if (offer_id) {
      query = query.eq("offer_id", offer_id);
    }

    if (url.searchParams.has("minPrice") && Number.isFinite(minPrice)) {
      query = query.gte("price", minPrice);
    }
    if (url.searchParams.has("maxPrice") && Number.isFinite(maxPrice)) {
      query = query.lt("price", maxPrice);
    }

    const newArrivalNow = Date.now();
    const newArrivalCutoff = new Date(newArrivalNow - NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    // Apply new-product filter based on the database timestamp.
    if (new_only) {
      query = query.gte("created_at", newArrivalCutoff).lte("created_at", new Date(newArrivalNow).toISOString());
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Products query error:", error);
      return serverError("Failed to fetch products");
    }

    // Transform response to match expected type and normalize nested relations.
    const transformedData = data?.map((item: Record<string, unknown>) => {
      const processedOffer = normalizeProductOffer(item.offers);

      return {
        ...item,
        category: Array.isArray(item.categories) ? item.categories[0] : item.categories || null,
        offer: processedOffer,
        categories: undefined,
        offers: undefined,
      };
    }) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .neq("availability", "sold");

    if (category_id) {
      countQuery = countQuery.eq("category_id", category_id);
    }

    if (offer_id) {
      countQuery = countQuery.eq("offer_id", offer_id);
    }

    if (url.searchParams.has("minPrice") && Number.isFinite(minPrice)) {
      countQuery = countQuery.gte("price", minPrice);
    }
    if (url.searchParams.has("maxPrice") && Number.isFinite(maxPrice)) {
      countQuery = countQuery.lt("price", maxPrice);
    }

    if (new_only) {
      countQuery = countQuery.gte("created_at", newArrivalCutoff).lte("created_at", new Date(newArrivalNow).toISOString());
    }

    const { count: totalCount } = await countQuery;

    const response = Response.json({
      data: transformedData,
      pagination: {
        limit,
        offset,
        total: totalCount || 0,
        hasMore: (offset + limit) < (totalCount || 0),
      },
    });
    return withCors(response, req, { origin: '*' });
  } catch (err) {
    console.error("Unexpected error:", err);
    const errorResponse = serverError("Unexpected error");
    return withCors(errorResponse, req, { origin: '*' });
  }
}
