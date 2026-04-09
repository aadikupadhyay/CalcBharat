import { notFound } from 'next/navigation';
import { TOOLS } from '@/data/tools';
import { CAT_META } from '@/data/categories';
import Breadcrumb from '@/components/Breadcrumb';
import SEOContent from '@/components/SEOContent';
import FAQSection from '@/components/FAQSection';
import RelatedTools from '@/components/RelatedTools';
import CalculatorEngine from '@/components/CalculatorEngine';

export function generateStaticParams() {
  return TOOLS.map(t => ({ category: t.category, slug: t.slug }));
}

export async function generateMetadata({ params }) {
  const { slug, category } = await params;
  const tool = TOOLS.find(t => t.slug === slug && t.category === category);
  if (!tool) return {};
  return {
    title: tool.metaTitle || tool.name,
    description: tool.metaDescription || tool.desc,
    openGraph: {
      title: tool.metaTitle || tool.name,
      description: tool.metaDescription || tool.desc,
      type: 'website',
    },
  };
}

export default async function ToolPage({ params }) {
  const { slug, category } = await params;
  const tool = TOOLS.find(t => t.slug === slug && t.category === category);
  if (!tool) return notFound();

  const appSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    description: tool.metaDescription || tool.desc,
    applicationCategory: 'UtilityApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    url: `https://calcbharat.com/${tool.category}/${tool.slug}/`,
  };

  return (
    <div className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appSchema) }} />
      <Breadcrumb tool={tool} />

      <div className="tool-header">
        <h1>{tool.icon} {tool.name}</h1>
        <p>{tool.desc}</p>
      </div>

      {tool.affiliate && (
        <div className="affiliate-banner">
          <div className="aff-text" dangerouslySetInnerHTML={{ __html: tool.affiliate.text }} />
          <button className="aff-btn">{tool.affiliate.btn}</button>
        </div>
      )}

      <CalculatorEngine tool={tool} />

      <SEOContent tool={tool} />

      {tool.faqs && tool.faqs.length > 0 && (
        <FAQSection faqs={tool.faqs} toolName={tool.name} />
      )}

      {tool.related && (
        <RelatedTools relatedIds={tool.related} currentId={tool.id} />
      )}
    </div>
  );
}
