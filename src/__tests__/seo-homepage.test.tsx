import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// Make React available globally for JSX in components that use the automatic runtime
globalThis.React = React;

// Mock HomeClient to avoid pulling in heavy client-side dependencies
vi.mock('@/app/home/HomeClient', () => ({ default: () => null }));

import { metadata } from '@/app/home/page';
import OrganizationJsonLd from '@/components/seo/OrganizationJsonLd';
import WebSiteJsonLd from '@/components/seo/WebSiteJsonLd';

// ═══════════════════════════════════════════════════════════════════════════
// Task 2.4 – Unit tests for homepage metadata and JSON-LD components
// ═══════════════════════════════════════════════════════════════════════════

describe('Homepage Metadata', () => {
  /**
   * Validates: Requirement 4.1
   */
  it('has the correct title', () => {
    expect(metadata.title).toBe('Shop the Best Deals on Mprimo - Global Marketplace');
  });

  /**
   * Validates: Requirement 4.2
   */
  it('has a description of at least 120 characters with marketplace keywords', () => {
    const desc = metadata.description as string;
    expect(desc.length).toBeGreaterThanOrEqual(120);
    expect(desc).toContain('deals');
    expect(desc).toContain('auctions');
    expect(desc).toContain('categories');
  });

  /**
   * Validates: Requirement 4.3
   */
  it('has Open Graph properties with type website', () => {
    const og = metadata.openGraph as Record<string, unknown>;
    expect(og.title).toBe('Shop the Best Deals on Mprimo - Global Marketplace');
    expect(og.description).toBeDefined();
    expect(og.url).toBe('https://mprimo-one.vercel.app/home');
    expect(og.type).toBe('website');
  });

  /**
   * Validates: Requirement 4.4
   */
  it('has Twitter Card properties with title and description', () => {
    const twitter = metadata.twitter as Record<string, unknown>;
    expect(twitter.title).toBe('Shop the Best Deals on Mprimo - Global Marketplace');
    expect(twitter.description).toBeDefined();
  });

  /**
   * Validates: Requirement 4.5
   */
  it('has canonical URL set to the homepage', () => {
    const alternates = metadata.alternates as Record<string, unknown>;
    expect(alternates.canonical).toBe('https://mprimo-one.vercel.app/home');
  });
});

describe('OrganizationJsonLd', () => {
  /**
   * Validates: Requirement 9.1
   * Parse the JSON-LD from the component's rendered script element
   */
  it('renders valid Organization JSON-LD', () => {
    const element = OrganizationJsonLd();
    expect(element.type).toBe('script');
    expect(element.props.type).toBe('application/ld+json');

    const jsonLd = JSON.parse(element.props.dangerouslySetInnerHTML.__html);
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Organization');
    expect(jsonLd.name).toBe('Mprimo');
    expect(jsonLd.url).toBe('https://mprimo-one.vercel.app');
    expect(jsonLd.logo).toBeDefined();
    expect(typeof jsonLd.logo).toBe('string');
  });
});

describe('WebSiteJsonLd', () => {
  /**
   * Validates: Requirement 9.2
   * Parse the JSON-LD from the component's rendered script element
   */
  it('renders valid WebSite JSON-LD with SearchAction', () => {
    const element = WebSiteJsonLd();
    expect(element.type).toBe('script');
    expect(element.props.type).toBe('application/ld+json');

    const jsonLd = JSON.parse(element.props.dangerouslySetInnerHTML.__html);
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('WebSite');
    expect(jsonLd.name).toBe('Mprimo');
    expect(jsonLd.url).toBe('https://mprimo-one.vercel.app');

    const action = jsonLd.potentialAction;
    expect(action).toBeDefined();
    expect(action['@type']).toBe('SearchAction');
    expect(action.target).toContain('/search?q=');
    expect(action['query-input']).toBeDefined();
  });
});
