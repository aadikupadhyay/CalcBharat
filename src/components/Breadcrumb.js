import Link from 'next/link';
import { CAT_META } from '@/data/categories';

export default function Breadcrumb({ tool }) {
  const catMeta = CAT_META[tool.category];
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://calcbharat.com/' },
      { '@type': 'ListItem', position: 2, name: catMeta.label, item: `https://calcbharat.com/calculators/` },
      { '@type': 'ListItem', position: 3, name: tool.name },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <div className="breadcrumb">
        <Link href="/">Home</Link> ›
        <Link href="/calculators/">{catMeta.label}</Link> ›
        <span>{tool.name}</span>
      </div>
    </>
  );
}
