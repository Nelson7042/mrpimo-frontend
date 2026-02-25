import { describe, it, expect, vi } from 'vitest';

// Mock CSS and heavy dependencies from layout.tsx to avoid PostCSS/module errors
vi.mock('@/app/globals.css', () => ({}));
vi.mock('next/font/google', () => ({
  Poppins: () => ({ variable: '--font-poppins' }),
  Inter: () => ({ variable: '--font-inter' }),
  Alexandria: () => ({ variable: '--font-alexandria' }),
  Roboto: () => ({ variable: '--font-roboto' }),
}));
vi.mock('next/script', () => ({ default: () => null }));
vi.mock('@/providers/TanstackProvider', () => ({ default: () => null }));
vi.mock('react-toastify', () => ({ ToastContainer: () => null, Slide: {} }));
vi.mock('@/components/TokenRefresher', () => ({ TokenRefresher: () => null }));
vi.mock('@/contexts/NotificationContext', () => ({ NotificationProvider: () => null }));
vi.mock('@/components/SocketInitializer', () => ({ default: () => null }));
vi.mock('@/components/providers/ToastProvider', () => ({ default: () => null }));

import { metadata } from '@/app/layout';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

// ═══════════════════════════════════════════════════════════════════════════
// Task 1.4 – Unit tests for root layout metadata, robots(), and sitemap()
// ═══════════════════════════════════════════════════════════════════════════

describe('Root Layout Metadata', () => {
  /**
   * Validates: Requirement 1.1
   * THE Root_Layout SHALL export metadata containing a title template and default title
   */
  it('has title template and default title', () => {
    const title = metadata.title as { template: string; default: string };
    expect(title.template).toBe('%s | Mprimo - Global Marketplace');
    expect(title.default).toBe('Mprimo - Global Marketplace');
  });

  /**
   * Validates: Requirement 1.2
   * THE Root_Layout SHALL export metadata containing a description of at least 50 characters
   */
  it('has description of at least 50 characters', () => {
    expect(typeof metadata.description).toBe('string');
    expect(metadata.description!.length).toBeGreaterThanOrEqual(50);
  });

  /**
   * Validates: Requirement 1.3
   * THE Root_Layout SHALL export metadata containing a metadataBase URL
   */
  it('has metadataBase set to the correct URL', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.metadataBase!.toString()).toBe('https://mprimo-one.vercel.app/');
  });

  /**
   * Validates: Requirement 1.4
   * THE Root_Layout SHALL export metadata with Open Graph defaults
   */
  it('has Open Graph defaults with siteName, type, and locale', () => {
    const og = metadata.openGraph as { siteName: string; type: string; locale: string };
    expect(og.siteName).toBe('Mprimo');
    expect(og.type).toBe('website');
    expect(og.locale).toBe('en_US');
  });

  /**
   * Validates: Requirement 1.5
   * THE Root_Layout SHALL export metadata with Twitter card summary_large_image
   */
  it('has Twitter card set to summary_large_image', () => {
    const twitter = metadata.twitter as { card: string };
    expect(twitter.card).toBe('summary_large_image');
  });
});

describe('robots()', () => {
  const result = robots();

  /**
   * Validates: Requirement 2.1
   * THE Robots_Config SHALL allow crawling of /home, /search, /home/categories
   */
  it('allows crawling of public paths', () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const rule = rules[0];
    expect(rule.userAgent).toBe('*');
    expect(rule.allow).toContain('/home');
    expect(rule.allow).toContain('/search');
    expect(rule.allow).toContain('/home/categories');
  });

  /**
   * Validates: Requirement 2.2
   * THE Robots_Config SHALL disallow crawling of private/admin paths
   */
  it('disallows crawling of private paths', () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const rule = rules[0];
    const disallowed = ['/admin', '/vendor/dashboard', '/home/dashboard', '/home/checkout', '/home/my-cart', '/payment'];
    for (const path of disallowed) {
      expect(rule.disallow).toContain(path);
    }
  });

  /**
   * Validates: Requirement 2.3
   * THE Robots_Config SHALL include a sitemap URL reference
   */
  it('includes sitemap URL', () => {
    expect(result.sitemap).toBe('https://mprimo-one.vercel.app/sitemap.xml');
  });
});

describe('sitemap()', () => {
  const entries = sitemap();

  /**
   * Validates: Requirement 3.1
   * THE Sitemap_Generator SHALL include all required static URLs
   */
  it('includes all required static URLs', () => {
    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://mprimo-one.vercel.app/home');
    expect(urls).toContain('https://mprimo-one.vercel.app/search');
    expect(urls).toContain('https://mprimo-one.vercel.app/home/categories');
    expect(urls).toContain('https://mprimo-one.vercel.app/home/best-deals');
    expect(urls).toContain('https://mprimo-one.vercel.app/home/collections');
  });

  /**
   * Validates: Requirement 3.2
   * THE Sitemap_Generator SHALL assign correct priorities
   */
  it('assigns correct priorities', () => {
    const home = entries.find((e) => e.url.endsWith('/home'));
    expect(home!.priority).toBe(1.0);

    const categories = entries.find((e) => e.url.endsWith('/home/categories'));
    expect(categories!.priority).toBe(0.8);

    const bestDeals = entries.find((e) => e.url.endsWith('/home/best-deals'));
    expect(bestDeals!.priority).toBe(0.8);
  });

  /**
   * Validates: Requirement 3.3
   * THE Sitemap_Generator SHALL set correct change frequencies
   */
  it('assigns correct change frequencies', () => {
    const home = entries.find((e) => e.url.endsWith('/home'));
    expect(home!.changeFrequency).toBe('daily');

    const categories = entries.find((e) => e.url.endsWith('/home/categories'));
    expect(categories!.changeFrequency).toBe('daily');

    const bestDeals = entries.find((e) => e.url.endsWith('/home/best-deals'));
    expect(bestDeals!.changeFrequency).toBe('daily');

    const search = entries.find((e) => e.url.endsWith('/search'));
    expect(search!.changeFrequency).toBe('weekly');

    const collections = entries.find((e) => e.url.endsWith('/home/collections'));
    expect(collections!.changeFrequency).toBe('weekly');
  });
});
