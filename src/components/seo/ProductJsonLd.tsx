export interface ProductJsonLdProps {
  name: string;
  description: string;
  image: string;
  sku: string;
  price: number;
  currency: string;
  availability: string;
  ratingValue?: number;
  reviewCount?: number;
}

export default function ProductJsonLd(props: ProductJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    description: props.description,
    image: props.image,
    sku: props.sku,
    offers: {
      '@type': 'Offer',
      price: props.price,
      priceCurrency: props.currency,
      availability: props.availability,
    },
    ...(props.ratingValue && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: props.ratingValue,
        reviewCount: props.reviewCount,
      },
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
