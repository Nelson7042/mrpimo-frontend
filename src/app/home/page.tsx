import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import WebSiteJsonLd from '@/components/seo/WebSiteJsonLd';

export const metadata: Metadata = {
  title: 'Shop the Best Deals on Mprimo - Global Marketplace',
  description: 'Explore thousands of products at unbeatable prices on Mprimo. Discover best deals, auctions, trending categories, and curated collections across electronics, fashion, home goods, and more.',
  openGraph: {
    title: 'Shop the Best Deals on Mprimo - Global Marketplace',
    description: 'Explore thousands of products at unbeatable prices on Mprimo.',
    url: 'https://mprimo-one.vercel.app/home',
    type: 'website',
  },
  twitter: {
    title: 'Shop the Best Deals on Mprimo - Global Marketplace',
    description: 'Explore thousands of products at unbeatable prices on Mprimo.',
  },
  alternates: {
    canonical: 'https://mprimo-one.vercel.app/home',
  },
};

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <HomeClient />
    </>
  );
}
