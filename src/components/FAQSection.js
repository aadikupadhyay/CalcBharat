'use client';
import { useState } from 'react';

export default function FAQSection({ faqs, toolName }) {
  const [openIndex, setOpenIndex] = useState(-1);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="seo-section">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2>Frequently Asked Questions</h2>
      {faqs.map((f, i) => (
        <div
          key={i}
          className={`faq-item ${openIndex === i ? 'open' : ''}`}
        >
          <div className="faq-q" onClick={() => setOpenIndex(openIndex === i ? -1 : i)}>
            {f.q}
          </div>
          <div className="faq-a">{f.a}</div>
        </div>
      ))}
    </div>
  );
}
