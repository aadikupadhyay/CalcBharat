'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function AccordionList({ categorized }) {
  const [openCats, setOpenCats] = useState(['finance']);

  const toggle = (cat) => {
    setOpenCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  return (
    <>
      {categorized.map(({ category, meta, tools }) => {
        const isOpen = openCats.includes(category);
        return (
          <div className="accordion" key={category}>
            <div
              className={`accordion-header ${isOpen ? 'open' : ''}`}
              style={{ '--acc-color': meta.color }}
              onClick={() => toggle(category)}
            >
              <div className="acc-left">
                <span className="acc-icon">{meta.icon}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="acc-title">{meta.label}</span>
                    <span className="acc-count">{tools.length} tools</span>
                  </div>
                  <div className="acc-desc">{meta.desc}</div>
                </div>
              </div>
              <span className="acc-chevron">▼</span>
            </div>
            <div className={`accordion-body ${isOpen ? 'open' : ''}`}>
              <div className="acc-tools-grid">
                {tools.map(t => (
                  <Link
                    key={t.id}
                    href={`/${t.category}/${t.slug}/`}
                    className="acc-tool-card"
                    style={{ '--acc-color': meta.color }}
                  >
                    <div className="acc-tool-emoji">{t.icon}</div>
                    <div>
                      <div className="acc-tool-name">{t.name}</div>
                      <div className="acc-tool-desc">{t.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
