import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/home', '/search', '/home/categories'],
        disallow: ['/admin', '/vendor/dashboard', '/home/dashboard', '/home/checkout', '/home/my-cart', '/payment'],
      },
    ],
    sitemap: 'https://mprimo-one.vercel.app/sitemap.xml',
  };
}
