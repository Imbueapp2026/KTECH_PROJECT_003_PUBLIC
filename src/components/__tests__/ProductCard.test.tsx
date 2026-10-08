import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import type { ProductJoined } from '@/types';

describe('ProductCard Component', () => {
  const mockProduct: ProductJoined = {
    id: 'prod-123',
    name: '22K Gold Filigree Necklace',
    description: 'Authentic handcrafted necklace',
    price: 85000,
    category_id: 'cat-1',
    category: {
      id: 'cat-1',
      name: 'Necklaces',
      slug: 'necklaces',
    },
    availability: 'available',
    status: 'published',
    offer_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    image_urls: ['https://example.com/necklace.jpg'],
    weight_grams: 14.5,
    purity_carats: 22,
    hallmark_certified: true,
  };

  it('renders product details correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('22K Gold Filigree Necklace')).toBeInTheDocument();
    expect(screen.getByText(/₹\s?85,000/)).toBeInTheDocument();
    expect(screen.getByText('Hallmark')).toBeInTheDocument();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', '22K Gold Filigree Necklace');
  });

  it('displays fallback when no image is provided', () => {
    const productWithoutImage: ProductJoined = {
      ...mockProduct,
      image_urls: [],
    };

    render(<ProductCard product={productWithoutImage} />);
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('does not show the New badge unless the card is in New Arrivals', () => {
    const olderProduct: ProductJoined = {
      ...mockProduct,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    };

    render(<ProductCard product={olderProduct} />);

    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(screen.getByText('Hallmark')).toBeInTheDocument();
  });

  it('shows the New badge when explicitly placed in New Arrivals', () => {
    render(<ProductCard product={mockProduct} showNewBadge />);

    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('renders discounted price and percentage offer badge', () => {
    const productWithOffer: ProductJoined = {
      ...mockProduct,
      price: 100000,
      offer_id: 'off-1',
      offer_price: 90000,
      offer_discount_amount: 10000,
      offer_discount_type: 'percentage',
      offer: {
        id: 'off-1',
        label: 'Diwali Dhamaka',
        description: null,
        is_active: true,
        start_date: null,
        end_date: null,
        discount: {
          id: 'disc-1',
          discount_type: 'percentage',
          value: 10,
        },
      },
    };

    render(<ProductCard product={productWithOffer} />);

    // Offer badge
    expect(screen.getByText('₹10,000 OFF')).toBeInTheDocument();
    expect(screen.getByText('Percentage offer')).toBeInTheDocument();

    // Original crossed-out price
    expect(screen.getByText(/₹\s?1,00,000/)).toBeInTheDocument();

    // Discounted price: 100,000 - 10% = 90,000
    expect(screen.getByText(/₹\s?90,000/)).toBeInTheDocument();
  });

  it('keeps Hallmark, New, and Offer in separate reserved rows', () => {
    const productWithAllTags: ProductJoined = {
      ...mockProduct,
      offer_id: 'off-1',
      offer_price: 80000,
      offer_discount_amount: 5000,
      offer_discount_type: 'making_charge',
    };

    const { container } = render(<ProductCard product={productWithAllTags} showNewBadge />);
    const card = container.querySelector('a > div');
    const tagRow = card?.children[0];
    const imageFrame = card?.children[1];
    const offerStrip = card?.children[2];

    expect(tagRow).toHaveClass('flex-wrap', 'min-h-7');
    expect(tagRow).toContainElement(screen.getByText('Hallmark'));
    expect(tagRow).toContainElement(screen.getByText('New'));
    expect(screen.getByText('Hallmark')).toHaveClass('bg-gold', 'text-charcoal');
    expect(screen.getByText('New')).toHaveClass('bg-dustyRose', 'text-charcoal');
    expect(imageFrame).toContainElement(screen.getByRole('img'));
    expect(screen.getByRole('img')).toHaveClass('object-contain', 'p-0');
    expect(imageFrame).not.toContainElement(screen.getByText('Hallmark'));
    expect(offerStrip).toHaveClass('offer-strip', 'min-h-9', 'bg-[#8A5A61]', 'text-white');
    expect(offerStrip).toContainElement(screen.getByText('₹5,000 OFF'));
    expect(offerStrip).toContainElement(screen.getByText('Making charge offer'));
  });

  it('keeps the tag row compact and collapses the offer strip when there are no tags or offer', () => {
    const untaggedProduct: ProductJoined = {
      ...mockProduct,
      hallmark_certified: false,
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const { container } = render(<ProductCard product={untaggedProduct} />);
    const card = container.querySelector('a > div');

    expect(card?.children[0]).toHaveClass('min-h-7');
    expect(card?.children[0].children).toHaveLength(0);
    expect(card?.querySelector('.offer-strip')).not.toBeInTheDocument();
    expect(screen.queryByText('Hallmark')).not.toBeInTheDocument();
    expect(screen.queryByText('New')).not.toBeInTheDocument();
  });

  it('renders a truncated description in the catalog card without adding an inline expand control', () => {
    const detailedProduct: ProductJoined = {
      ...mockProduct,
      description: 'A handcrafted necklace with delicate filigree work, heirloom detailing, and a statement silhouette designed for celebrations and everyday elegance.',
    };

    render(<ProductCard product={detailedProduct} />);

    const description = screen.getByText(/A handcrafted necklace with delicate filigree work/i);
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('line-clamp-2');

    expect(screen.queryByRole('button', { name: /read more|show more/i })).not.toBeInTheDocument();
  });
});
