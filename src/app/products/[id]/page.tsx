import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import { getAnonClient } from '@/lib/supabase';
import { ProductDetailView } from './ProductDetailView';
import { ProductRelatedSection } from './ProductRelatedSection';
import type { ProductJoined } from '@/types';

export const revalidate = 60;
export const dynamicParams = true;

interface Props {
  params: Promise<{ id: string }>;
}

const getCachedProduct = unstable_cache(async (id: string): Promise<ProductJoined | null> => {
  const supabase = getAnonClient();
  const { data, error } = await supabase
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
      category_id,
      offer_id,
      purity_carats,
      weight_grams,
      net_weight_grams,
      making_charge_percent,
      making_charge_flat,
      making_charge_type,
      certifications,
      material_type,
      gst_percent,
      categories (name)
    `)
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !data) return null;

  const category = Array.isArray(data.categories) ? data.categories[0] : data.categories;
  const restData = { ...(data as Record<string, unknown>) };
  delete restData.categories;

  return {
    ...restData,
    category: category || null,
  } as unknown as ProductJoined;
}, ['published-product-by-id'], { revalidate: 60 });

export async function generateStaticParams(): Promise<{ id: string }[]> {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .eq('status', 'published')
      .limit(1000);

    if (error) {
      console.error('[products] Failed to load published IDs for static generation:', error);
      return [];
    }

    return (data ?? []).map(({ id }) => ({ id }));
  } catch (error) {
    console.error('[products] Static generation is falling back to on-demand IDs:', error);
    return [];
  }
}

async function getRelatedProducts(categoryId: string, currentProductId: string): Promise<ProductJoined[]> {
  const supabase = getAnonClient();
  const { data } = await supabase
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
      offer_id,
      categories (name)
    `)
    .eq("category_id", categoryId)
    .eq("status", "published")
    .neq("id", currentProductId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data || []).map((p) => {
    const category = Array.isArray(p.categories) ? p.categories[0] : p.categories;
    const restData = { ...(p as Record<string, unknown>) };
    delete restData.categories;
    return {
      ...restData,
      category: category || null,
    } as unknown as ProductJoined;
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getCachedProduct(id);

  if (!product) {
    return {
      title: 'Product Not Found | Avirat Jewelers',
      description: 'The requested jewelry item could not be found.',
    };
  }

  const title = `${product.name} | Avirat Jewelers`;
  const description = product.description
    ? product.description.slice(0, 160)
    : `Explore ${product.name} crafted in ${product.material_type || 'precious metal'} by Avirat Jewelers.`;
  const images = product.image_urls && product.image_urls.length > 0 ? [product.image_urls[0]] : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getCachedProduct(id);

  if (!product) {
    notFound();
  }

  return (
    <>
      <ProductDetailView product={product} />
      {product.category_id && (
        <Suspense fallback={<RelatedProductsSkeleton />}>
          <ProductRelatedSection
            categoryId={product.category_id}
            currentProductId={product.id}
            getRelatedProducts={getRelatedProducts}
          />
        </Suspense>
      )}
    </>
  );
}

function RelatedProductsSkeleton() {
  return (
    <section className="mx-auto mt-12 max-w-4xl px-3 sm:px-4 md:px-8" aria-hidden="true">
      <div className="mb-6 h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="aspect-square animate-pulse rounded-sm bg-gray-100" />
        ))}
      </div>
    </section>
  );
}
