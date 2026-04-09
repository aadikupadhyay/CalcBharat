import Link from 'next/link';
import { TOOLS } from '@/data/tools';
import { CATEGORIES_ORDER, CAT_META } from '@/data/categories';
import AccordionList from './AccordionList';

export const metadata = {
  title: 'All Calculators – 50 Free Tools for India',
  description: 'Browse all 50 free Indian calculators: Finance (SIP, EMI, GST, Tax), Real Estate (Stamp Duty, Construction), Academic (CGPA, GPA), Lifestyle & Converters.',
};

export default function CalculatorsPage() {
  const categorized = CATEGORIES_ORDER.map(cat => ({
    category: cat,
    meta: CAT_META[cat],
    tools: TOOLS.filter(t => t.category === cat),
  }));

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'All CalcBharat Calculators',
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      url: `https://calcbharat.com/${t.category}/${t.slug}/`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <div className="allcalc-hero">
        <h1>📋 All Calculators</h1>
        <p>50 free tools — browse by category, click any to open instantly.</p>
      </div>
      <div className="allcalc-section">
        <AccordionList categorized={categorized} />
      </div>
    </>
  );
}
