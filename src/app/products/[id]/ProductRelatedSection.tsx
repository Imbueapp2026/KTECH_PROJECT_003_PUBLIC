import { ProductCard } from '@/components/ProductCard';
import type { ProductJoined } from '@/types';

interface ProductRelatedSectionProps {
  categoryId: string;
  currentProductId: string;
  getRelatedProducts: (categoryId: string, currentProductId: string) => Promise<ProductJoined[]>;
}

export async function ProductRelatedSection({
  categoryId,
  currentProductId,
  getRelatedProducts,
}: ProductRelatedSectionProps) {
  const relatedProducts = await getRelatedProducts(categoryId, currentProductId);
  if (relatedProducts.length === 0) return null;

  return (
    <section className="mx-auto mt-12 max-w-4xl px-3 sm:px-4 md:px-8">
      <h2 className="mb-6 font-serif text-2xl text-charcoal">You may also like</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {relatedProducts.map((relatedProduct) => (
          <ProductCard key={relatedProduct.id} product={relatedProduct} />
        ))}
      </div>
    </section>
  );
}