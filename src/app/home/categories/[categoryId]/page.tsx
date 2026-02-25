import type { Metadata } from 'next';
import CategoryClient from './CategoryClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mprimo-production.up.railway.app/api/v1';
const BASE_URL = 'https://mprimo-one.vercel.app';

export async function fetchCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/slug/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.category;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string }> }): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await fetchCategory(categoryId);
  if (!category) return {};

  return {
    title: category.name,
    description: `Browse ${category.name} products on Mprimo. Find the best deals and widest selection in ${category.name}.`,
    openGraph: {
      title: category.name,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/home/categories/${categoryId}`,
    },
  };
}

export default function CategoryPage() {
  return <CategoryClient />;
}
