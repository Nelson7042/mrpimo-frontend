import type { Metadata } from 'next';
import ProductDetailsClient from './ProductDetailsClient';
import ProductJsonLd from '@/components/seo/ProductJsonLd';

const BASE_URL = 'https://mprimo-one.vercel.app';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mprimo-production.up.railway.app/api/v1';

async function fetchProduct(id: string) {
  try {
    const res = await fetch(`${API_URL}/products/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await fetchProduct(id);
  if (!product) return {};

  const title = product.name;
  const description = (product.description || '').slice(0, 160);

  return {
    title,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/home/product-details/${id}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  return (
    <>
      {product && (
        <ProductJsonLd
          name={product.name}
          description={product.description || ''}
          image={product.images?.[0] || ''}
          sku={product.inventory?.sku || product._id || ''}
          price={product.inventory?.listing?.instant?.price || product.auctionConfig?.startBidPrice || 0}
          currency={product.country?.currency || 'USD'}
          availability={product.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}
          ratingValue={product.rating || undefined}
          reviewCount={product.reviews?.length || undefined}
        />
      )}
      <ProductDetailsClient />
    </>
  );
}
