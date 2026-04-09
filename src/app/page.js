import Link from 'next/link';
import { TOOLS } from '@/data/tools';
import { CATEGORIES_ORDER, CAT_META } from '@/data/categories';

export default function HomePage() {
  const popularTools = TOOLS.slice(0, 10);

  const homeSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CalcBharat',
    url: 'https://calcbharat.com',
    description: 'Free online calculators for Finance, Real Estate, Academic & Unit Conversions. 50+ tools built for India.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://calcbharat.com/calculators/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }} />

      <div className="hero">
        <h1>India&apos;s #1 Free<br /><em>Calculator Hub</em></h1>
        <p>50 tools across Finance, Real Estate, Academic, Lifestyle &amp; Converters. Built for India.</p>
        <div className="hero-stats">
          <div className="stat"><strong>50</strong><span>Tools</span></div>
          <div className="stat"><strong>Free</strong><span>Forever</span></div>
          <div className="stat"><strong>0.3s</strong><span>Load Time</span></div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Browse by Category</div>
        <div className="cat-grid">
          {CATEGORIES_ORDER.map(cat => {
            const meta = CAT_META[cat];
            return (
              <Link key={cat} href="/calculators/" className="cat-card" style={{ '--cat-color': meta.color }}>
                <div className="cat-icon">{meta.icon}</div>
                <h3>{meta.label}</h3>
                <p>{meta.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-title">⭐ Popular Tools <span className="pill-tag">Most Used</span></div>
        <div className="tools-grid">
          {popularTools.map(t => (
            <Link key={t.id} href={`/${t.category}/${t.slug}/`} className="tool-card">
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-name">{t.name}</div>
              <div className="tool-desc">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-title">More Tools</div>
        <div className="tools-grid">
          {TOOLS.slice(10).map(t => (
            <Link key={t.id} href={`/${t.category}/${t.slug}/`} className="tool-card">
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-name">{t.name}</div>
              <div className="tool-desc">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
