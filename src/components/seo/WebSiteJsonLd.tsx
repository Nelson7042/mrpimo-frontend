export default function WebSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Mprimo',
    url: 'https://mprimo-one.vercel.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://mprimo-one.vercel.app/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
